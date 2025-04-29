# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import ValidationError

class MaterialConfig(models.Model):
    _name = 'rich_production.material.config'
    _description = '材料配置'
    _rec_name = 'material_id'
    _order = 'material_id'

    material_id = fields.Char(string='材料ID', required=True, index=True, 
                             help='材料标识符，例如 HMST82-01')
    length = fields.Float(string='标准长度', required=True, 
                         help='材料的标准长度（单位：cm）')
    description = fields.Text(string='描述', 
                             help='材料的描述信息')
    active = fields.Boolean(string='有效', default=True, 
                           help='设置为无效可以隐藏记录而不删除它')
    
    _sql_constraints = [
        ('material_id_uniq', 'unique(material_id)', '材料ID必须唯一！')
    ]

    @api.constrains('material_id')
    def _check_material_id(self):
        for record in self:
            if not record.material_id:
                raise ValidationError(_('材料ID不能为空'))

    @api.constrains('length')
    def _check_length(self):
        for record in self:
            if record.length <= 0:
                raise ValidationError(_('标准长度必须大于0'))
    
    @api.model
    def get_material_length(self, material_name):
        """根据材料名称获取标准长度
        
        Args:
            material_name (str): 材料名称
            
        Returns:
            float: 材料标准长度，如果未找到则返回233作为默认值
        """
        material = self.search([('material_id', '=ilike', material_name + '%')], limit=1)
        if material:
            return material.length
        return 233.0  # 默认值 