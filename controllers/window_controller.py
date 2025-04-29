from odoo import http
from odoo.http import request
import json
import logging

_logger = logging.getLogger(__name__)

class WindowController(http.Controller):
    
    @http.route('/api/window/save_calculations', type='json', auth='user')
    def save_calculations(self, **kwargs):
        """API endpoint to save multiple window calculation results"""
        try:
            # Get calculation results from request
            calculation_results = request.jsonrequest.get('calculation_results', [])
            
            if not calculation_results:
                return {'success': False, 'error': 'No calculation results provided'}
                
            # Save the calculation results
            result_ids = request.env['window.calculation.result'].save_multiple_calculations(calculation_results)
            
            return {
                'success': True,
                'message': f"Successfully saved {len(result_ids)} calculation results",
                'result_ids': result_ids
            }
        except Exception as e:
            _logger.error(f"Error saving calculations: {str(e)}")
            return {'success': False, 'error': str(e)} 