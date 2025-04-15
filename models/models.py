# -*- coding: utf-8 -*-

from odoo import models, fields, api
from datetime import timedelta
import json

# 将Production类的导入重定向到production.py
from .production import Production

class ProductionLine(models.Model):
    _name = 'rich_production.line'
    _description = 'Production Line'
    _rec_name = 'display_name'  # 使用display_name作为记录名称
    
    production_id = fields.Many2one('rich_production.production', string='Production', required=True, ondelete='cascade', index=True)
    product_id = fields.Many2one('product.product', string='Product', required=True)
    quantity = fields.Float(string='Quantity', required=True, default=1.0)
    uom_id = fields.Many2one('uom.uom', string='Unit of Measure')
    
    # 状态字段
    state = fields.Selection([
        ('draft', '草稿'),
        ('progress', '进行中'),
        ('done', '完成'),
        ('cancel', '取消')
    ], string='状态', default='draft', required=True, tracking=True,
        help="产品行状态")
    
    # 发票相关字段
    invoice_id = fields.Many2one('account.move', string='Source Invoice', index=True)
    invoice_line_id = fields.Many2one('account.move.line', string='Invoice Line')
    
    # 产品基本信息 - 使用jsonb兼容字段
    product_name = fields.Text(string='Product Name', compute='_compute_product_name', store=True)
    display_name = fields.Char(string='Product', compute='_compute_display_name', store=True)
    invoice_name = fields.Char(string='Invoice Number', related='invoice_id.name', store=True)
    
    # 调整字段名称以匹配invoice line
    window_width = fields.Char(string='Width')
    window_height = fields.Char(string='Height')
    frame_type = fields.Char(string='Frame')
    glass_type = fields.Char(string='Glass')
    color = fields.Char(string='Color')
    grid_type = fields.Char(string='Grid')
    
    # 保持兼容的别名字段
    width = fields.Char(string='Width', related='window_width', store=True)
    height = fields.Char(string='Height', related='window_height', store=True)
    frame = fields.Char(string='Frame', related='frame_type', store=True)
    glass = fields.Char(string='Glass', related='glass_type', store=True)
    grid = fields.Char(string='Grid', related='grid_type', store=True)
    
    # 添加固定高度相关字段
    fixed_height_position = fields.Char(string='Fixed Height Position')
    fixed_height = fields.Char(string='Fixed Height')
    
    # 向后兼容
    fh_position = fields.Char(string='FH Position', related='fixed_height_position', store=True)
    fixed_type = fields.Char(string='Fixed Type', related='fixed_height', store=True)
    
    # 网格相关字段
    grid_size = fields.Char(string='Grid Size')
    
    # Argon相关
    argon = fields.Char(string='Argon')
    
    # 其他字段
    trim = fields.Char(string='Trim')
    note = fields.Text(string='Note')
    
    # 序列号用于排序
    sequence = fields.Integer(string='Sequence', default=10)
    
    # 价格信息
    unit_price = fields.Float(string='Unit Price')
    amount = fields.Float(string='Amount')
    
    # 其他信息
    notes = fields.Text(string='Notes')
    
    @api.depends('product_id', 'product_id.name')
    def _compute_product_name(self):
        """计算产品名称并确保JSON兼容"""
        for record in self:
            if record.product_id and record.product_id.name:
                # 将产品名转换为JSON兼容格式
                record.product_name = json.dumps(record.product_id.name)
            else:
                record.product_name = json.dumps("")
                
    @api.depends('product_id', 'product_id.name')
    def _compute_display_name(self):
        """计算用于显示的产品名称（普通文本）"""
        for record in self:
            if record.product_id:
                record.display_name = record.product_id.name or "未命名产品"
            else:
                record.display_name = "未命名产品"
    
    # 添加SQL约束确保数据一致性
    _sql_constraints = [
        ('production_product_unique', 
         'unique(production_id, product_id, invoice_line_id)', 
         'Product line must be unique per production and invoice line!')
    ]
    
    def name_get(self):
        """自定义记录显示名称"""
        result = []
        for record in self:
            product_name = record.product_id.name if record.product_id else "Product"
            name = f"{product_name} - {record.quantity}"
            if record.invoice_name:
                name += f" ({record.invoice_name})"
            result.append((record.id, name))
        return result

