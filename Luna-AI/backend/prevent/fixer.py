class PreventionFixer:
    def __init__(self, detect_results, protect_results):
        self.detect_results = detect_results
        self.protect_results = protect_results

    def generate_recommendations(self):
        """Generates security recommendations based on findings."""
        recommendations = []
        
        # SQLi Recommendations
        if self.detect_results.get('sqli', {}).get('status') == 'suspicious':
            recommendations.append({
                "type": "SQL Injection",
                "fix": "Use parameterized queries (Prepared Statements) and ORMs to prevent raw SQL execution.",
                "priority": "High"
            })
            
        # XSS Recommendations
        if self.detect_results.get('xss', {}).get('status') == 'suspicious':
            recommendations.append({
                "type": "Cross-Site Scripting (XSS)",
                "fix": "Sanitize all user inputs on the server-side and use Content-Security-Policy (CSP) headers.",
                "priority": "High"
            })
            
        # Header Recommendations
        for header in self.protect_results.get('headers', []):
            if not header['safe']:
                recommendations.append({
                    "type": f"Missing Header: {header['header']}",
                    "fix": f"Add the {header['header']} header to your web server configuration.",
                    "priority": "Medium"
                })
                
        return recommendations
