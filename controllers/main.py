from odoo import http
from odoo.http import request
import json

class RichProductionController(http.Controller):
    
    @http.route('/rich_production/get_productions', type='json', auth='user')
    def get_productions(self):
        """获取生产记录数据"""
        productions = request.env['rich_production.production'].search([])
        result = []
        
        for production in productions:
            customer_name = production.customer_id.name if production.customer_id else ''
            
            result.append({
                'id': production.id,
                'name': production.name,
                'order_number': production.order_number,
                'start_date': production.start_date,
                'stop_date': production.stop_date,
                'color': production.color,
                'customer_name': customer_name,
                'items_count': production.items_count,
                'batch': production.batch,
                'notes': production.notes,
            })
            
        return result 