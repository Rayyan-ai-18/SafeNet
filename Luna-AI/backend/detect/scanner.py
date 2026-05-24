from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup

class ScanEngine:
    def __init__(self, url):
        self.url = url

    def _friendly_navigation_error(self, error):
        message = str(error).lower()
        if "timeout" in message:
            return "Target website timed out during navigation."
        if "err_name_not_resolved" in message:
            return "Target domain could not be resolved."
        if "err_connection_refused" in message:
            return "Target website refused the connection."
        if "err_connection_timed_out" in message:
            return "Target website connection timed out."
        if "err_internet_disconnected" in message:
            return "Network appears offline while reaching the target website."
        return "Could not load the target website for active scanning."

    def _goto_page(self, page, timeout=45000):
        """Navigate with softer wait conditions so slow sites don't fail the whole scan."""
        strategies = [
            ("commit", timeout),
            ("load", timeout),
            ("domcontentloaded", min(timeout, 30000)),
        ]

        last_error = None
        for wait_until, wait_timeout in strategies:
            try:
                page.goto(self.url, wait_until=wait_until, timeout=wait_timeout)
                return
            except Exception as exc:
                last_error = exc

        raise RuntimeError(self._friendly_navigation_error(last_error)) from last_error

    def get_dom(self, page):
        """Extracts full DOM and input metadata using Playwright."""
        print("[+] Navigating to URL...")
        self._goto_page(page)
        dom = page.content()
        
        soup = BeautifulSoup(dom, 'html.parser')
        inputs = []
        print("[+] Analyzing DOM for inputs...")
        for tag in soup.find_all(['input', 'textarea', 'select']):
            inputs.append({
                'tag': tag.name,
                'type': tag.get('type', 'text'),
                'name': tag.get('name', ''),
                'id': tag.get('id', '')
            })
            
        forms_metadata = []
        print("[+] Identifying forms...")
        for form in soup.find_all('form'):
            forms_metadata.append({
                'action': form.get('action', ''),
                'method': form.get('method', 'get').upper()
            })
            
        return dom, inputs, forms_metadata

    def check_sqli(self, page):
        """Active check for SQLi vulnerability using Playwright."""
        vulnerabilities = []
        payload = "' OR '1'='1"
        
        print("[+] Testing for SQL injection...")
        forms = page.query_selector_all("form")
        
        for idx, form in enumerate(forms):
            try:
                # Find all interactive inputs in this form
                inputs = form.query_selector_all("input:not([type='hidden']), textarea")
                if not inputs: continue
                
                print(f"[+] Testing form #{idx+1}...")
                for input_el in inputs:
                    try:
                        input_el.fill(payload)
                    except:
                        pass
                
                # Try to submit the form
                # We can try pressing Enter or finding a submit button
                try:
                    page.keyboard.press("Enter")
                except:
                    submit_btn = form.query_selector("button[type='submit'], input[type='submit']")
                    if submit_btn: submit_btn.click()
                
                try:
                    page.wait_for_load_state("load", timeout=8000)
                except Exception:
                    pass
                new_dom = page.content().lower()
                
                sql_errors = ["sql syntax", "mysql_fetch", "ora-", "sqlite3.error", "postgresql error"]
                for error in sql_errors:
                    if error in new_dom:
                        vulnerabilities.append(f"SQL Error detected in form #{idx+1}. Error: {error}")
                
                # Navigate back for next form
                self._goto_page(page)
                forms = page.query_selector_all("form") # Refresh handles
            except Exception as e:
                print(f"[-] Error testing form #{idx+1} for SQLi: {e}")
        
        status = "safe"
        reason = "No obvious SQLi vulnerabilities found."
        if vulnerabilities:
            print("[!] SQL Injection vulnerability detected!")
            status = "vulnerable"
            reason = "SQL errors detected after injection."
        elif forms:
            status = "suspicious"
            reason = "Forms detected. Manual verification recommended."

        return {
            "status": status,
            "findings": vulnerabilities,
            "reason": reason
        }

    def check_xss(self, page):
        """Active check for XSS vulnerability using Playwright."""
        vulnerabilities = []
        payload = "<script>console.log('LUNA_XSS_DETECTED')</script>"
        
        print("[+] Testing for Cross-Site Scripting...")
        self._goto_page(page)
        forms = page.query_selector_all("form")
        
        for idx, form in enumerate(forms):
            try:
                inputs = form.query_selector_all("input:not([type='hidden']), textarea")
                if not inputs: continue
                
                for input_el in inputs:
                    try:
                        input_el.fill(payload)
                    except:
                        pass
                
                try:
                    page.keyboard.press("Enter")
                except:
                    submit_btn = form.query_selector("button[type='submit'], input[type='submit']")
                    if submit_btn: submit_btn.click()
                
                try:
                    page.wait_for_load_state("load", timeout=8000)
                except Exception:
                    pass
                new_dom = page.content()
                
                if payload in new_dom:
                    vulnerabilities.append(f"XSS Payload reflected in form #{idx+1}")
                
                self._goto_page(page)
                forms = page.query_selector_all("form")
            except Exception as e:
                print(f"[-] Error testing form #{idx+1} for XSS: {e}")
        
        status = "safe"
        reason = "No XSS reflection detected."
        if vulnerabilities:
            print("[!] XSS vulnerability detected!")
            status = "vulnerable"
            reason = "Script tag reflected in DOM."
        elif forms:
            status = "suspicious"
            reason = "Forms detected. Manual verification recommended."

        return {
            "status": status,
            "findings": vulnerabilities,
            "reason": reason
        }

    def run_all(self):
        """Main execution flow using Playwright."""
        with sync_playwright() as p:
            print("[+] Launching Chromium...")
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                viewport={"width": 1920, "height": 1080},
                ignore_https_errors=True
            )
            page = context.new_page()
            
            try:
                try:
                    dom, inputs, forms_metadata = self.get_dom(page)
                except Exception as e:
                    print(f"[-] DOM extraction failed: {e}")
                    friendly_reason = str(e)
                    return {
                        "dom_summary": {
                            "input_count": 0,
                            "form_count": 0
                        },
                        "sqli": {
                            "status": "error",
                            "findings": [],
                            "reason": friendly_reason
                        },
                        "xss": {
                            "status": "error",
                            "findings": [],
                            "reason": friendly_reason
                        }
                    }

                try:
                    sqli_results = self.check_sqli(page)
                except Exception as e:
                    print(f"[-] SQLi phase failed: {e}")
                    sqli_results = {
                        "status": "error",
                        "findings": [],
                        "reason": "SQL injection checks could not be completed on this target."
                    }

                try:
                    xss_results = self.check_xss(page)
                except Exception as e:
                    print(f"[-] XSS phase failed: {e}")
                    xss_results = {
                        "status": "error",
                        "findings": [],
                        "reason": "XSS checks could not be completed on this target."
                    }

                return {
                    "dom_summary": {
                        "input_count": len(inputs),
                        "form_count": len(forms_metadata)
                    },
                    "sqli": sqli_results,
                    "xss": xss_results
                }
            finally:
                print("[+] Closing browser...")
                browser.close()
