import requests

class ProtectionChecker:
    def __init__(self, url):
        self.url = url

    def _friendly_error(self, error):
        if isinstance(error, requests.exceptions.Timeout):
            return "Target website timed out while checking headers."
        if isinstance(error, requests.exceptions.ConnectionError):
            return "Could not connect to the target website to inspect headers."
        if isinstance(error, requests.exceptions.InvalidURL):
            return "The target URL is invalid for header checks."
        return "Header scan failed due to a network or response issue."

    def check_headers(self):
        """Checks for security headers."""
        try:
            response = requests.get(self.url, timeout=10)
            headers = response.headers
            
            checklist = {
                "Content-Security-Policy": "CSP",
                "Strict-Transport-Security": "HSTS",
                "X-Frame-Options": "Clickjacking Protection",
                "X-Content-Type-Options": "MIME-sniffing Protection",
                "X-XSS-Protection": "Legacy XSS Filter"
            }
            
            results = []
            for header, label in checklist.items():
                present = header in headers
                results.append({
                    "header": header,
                    "label": label,
                    "status": "Present" if present else "Missing",
                    "safe": present
                })
                
            return {
                "headers": results,
                "server": headers.get('Server', 'Unknown'),
                "powered_by": headers.get('X-Powered-By', 'Hidden')
            }
        except Exception as e:
            return {"error": self._friendly_error(e)}
