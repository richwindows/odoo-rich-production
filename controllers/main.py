from odoo import http
from odoo.http import request
import json
import logging
from odoo.tools.translate import _

_logger = logging.getLogger(__name__)

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

class MaterialConfigController(http.Controller):
    
    @http.route('/api/material/length', type='http', auth='user', methods=['GET'], csrf=False)
    def get_material_length(self, material_id=None, **kwargs):
        """获取材料的标准长度
        
        Args:
            material_id (str): 材料ID
            
        Returns:
            json: 包含材料ID和长度的JSON数据
        """
        if not material_id:
            return json.dumps({'error': 'Material ID is required'})
        
        try:
            material = request.env['rich_production.material.config'].sudo().search(
                [('material_id', '=ilike', material_id + '%')], 
                limit=1
            )
            
            if material:
                return json.dumps({
                    'success': True,
                    'material_id': material.material_id,
                    'length': material.length
                })
            else:
                return json.dumps({
                    'success': False,
                    'error': 'Material not found',
                    'default_length': 233.0
                })
        except Exception as e:
            _logger.error("Error fetching material length: %s", e)
            return json.dumps({
                'success': False,
                'error': str(e),
                'default_length': 233.0
            })
    
    @http.route('/api/materials', type='http', auth='user', methods=['GET'], csrf=False)
    def get_all_materials(self, **kwargs):
        """获取所有材料配置
        
        Returns:
            json: 包含所有材料配置的JSON数据
        """
        try:
            materials = request.env['rich_production.material.config'].sudo().search([('active', '=', True)])
            
            result = {
                'success': True,
                'materials': [{
                    'id': material.material_id,
                    'length': material.length,
                    'description': material.description or ''
                } for material in materials]
            }
            
            return json.dumps(result)
        except Exception as e:
            _logger.error("Error fetching materials: %s", e)
            return json.dumps({
                'success': False,
                'error': str(e)
            }) 