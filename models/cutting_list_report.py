from odoo import models, fields, api
import json

class RichProductionCuttingListReport(models.Model):
    _name = 'rich_production.cutting.list.report'
    _description = 'Cutting List Report'
    
    name = fields.Char(string='Report Name')
    production_id = fields.Many2one('rich.production.production', string='Production Order', required=True)
    report_date = fields.Date(string='Report Date', default=fields.Date.context_today)
    state = fields.Selection([
        ('draft', 'Draft'),
        ('done', 'Generated')
    ], string='Status', default='draft')
    report_file = fields.Binary(string='Report File')
    report_filename = fields.Char(string='File Name')
    
    @api.model
    def create(self, vals):
        """创建时自动生成名称"""
        result = super(RichProductionCuttingListReport, self).create(vals)
        if not result.name:
            production = result.production_id
            batch_number = production.batch_number or production.id
            result.name = f'Cutting List - {batch_number}'
        return result
    
    def generate_report(self):
        """生成Excel报表"""
        self.ensure_one()
        try:
            # 生成Excel报表的代码
            # ...
            
            # 更新状态
            self.write({
                'state': 'done',
                # 'report_file': base64.b64encode(excel_data),
                'report_filename': f'cutting_list_{self.production_id.batch_number or self.production_id.id}.xlsx'
            })
            return True
        except Exception as e:
            # 记录错误
            return False 