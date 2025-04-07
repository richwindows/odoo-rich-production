# -*- coding: utf-8 -*-

import base64
import io
import logging
from datetime import datetime

try:
    import xlsxwriter
except ImportError:
    xlsxwriter = None

from odoo import models, fields, api, _
from odoo.exceptions import UserError

_logger = logging.getLogger(__name__)

class CuttingListReport(models.TransientModel):
    _name = 'rich_production.cutting.list.report'
    _description = 'Cutting List Report'

    production_id = fields.Many2one('rich_production.production', string='Production', required=True)
    report_file = fields.Binary('Report File', readonly=True)
    report_filename = fields.Char('Report Filename', readonly=True)
    state = fields.Selection([
        ('draft', 'Draft'),
        ('done', 'Done'),
    ], default='draft', string='State')

    @api.model
    def create(self, vals):
        rec = super(CuttingListReport, self).create(vals)
        if rec.production_id:
            rec.generate_report()
        return rec

    def generate_report(self):
        """生成Excel格式的下料单报表"""
        self.ensure_one()
        
        if not xlsxwriter:
            raise UserError(_("You need to install the xlsxwriter Python library."))
        
        production = self.production_id
        
        # 创建内存中的Excel工作簿
        output = io.BytesIO()
        workbook = xlsxwriter.Workbook(output)
        
        # 设置样式
        title_style = workbook.add_format({
            'font_name': 'Arial',
            'font_size': 16,
            'bold': True,
            'align': 'center',
            'valign': 'vcenter',
            'border': 1,
        })
        
        header_style = workbook.add_format({
            'font_name': 'Arial',
            'font_size': 12,
            'bold': True,
            'align': 'center',
            'valign': 'vcenter',
            'bg_color': '#D3D3D3',
            'border': 1,
        })
        
        batch_style = workbook.add_format({
            'font_name': 'Arial',
            'font_size': 14,
            'bold': True,
            'align': 'left',
            'valign': 'vcenter',
            'border': 1,
        })
        
        cell_style = workbook.add_format({
            'font_name': 'Arial',
            'font_size': 11,
            'align': 'center',
            'valign': 'vcenter',
            'border': 1,
            'bg_color': '#F5F5DC',  # 浅米色背景
        })
        
        # 创建General Information工作表
        worksheet = workbook.add_worksheet('General Information')
        
        # 设置列宽
        worksheet.set_column('A:A', 15)  # Customer列宽
        worksheet.set_column('B:B', 5)   # ID列宽
        worksheet.set_column('C:C', 8)   # Style列宽
        worksheet.set_column('D:D', 10)  # W列宽
        worksheet.set_column('E:E', 10)  # H列宽
        worksheet.set_column('F:F', 5)   # FH列宽
        worksheet.set_column('G:G', 15)  # Frame列宽
        worksheet.set_column('H:H', 15)  # Glass列宽
        worksheet.set_column('I:I', 8)   # Argon列宽
        worksheet.set_column('J:J', 8)   # Grid列宽
        worksheet.set_column('K:K', 10)  # Color列宽
        worksheet.set_column('L:L', 15)  # Note列宽
        worksheet.set_column('M:M', 5)   # ID列宽
        
        # 添加打印按钮和开始按钮
        worksheet.merge_range('A1:F1', 'PrintPage', workbook.add_format({'border': 1}))
        worksheet.merge_range('G1:L1', 'General Information', title_style)
        worksheet.merge_range('M1:M1', 'Start', workbook.add_format({'border': 1}))
        
        # 添加批次号
        worksheet.merge_range('A2:B2', 'Batch NO.', batch_style)
        worksheet.merge_range('C2:F2', production.batch_number or '', batch_style)
        
        # 添加表头
        headers = ['Customer', 'ID', 'Style', 'W', 'H', 'FH', 'Frame', 'Glass', 'Argon', 'Grid', 'Color', 'Note', 'ID']
        for col, header in enumerate(headers):
            worksheet.write(3, col, header, header_style)
        
        # 添加产品数据
        row = 4
        item_id = 1
        
        for line in production.product_line_ids:
            # 提取产品类型（Style）- 通常在产品名称中包含，如XO, XOX
            product_name = line.product_id.name if line.product_id else ''
            style = ''
            
            # 尝试从产品名称中提取风格类型
            if 'XOX' in product_name:
                style = 'XOX'
            elif 'XO' in product_name:
                style = 'XO'
            elif 'OX' in product_name:
                style = 'OX'
            elif 'Picture' in product_name:
                style = 'P'
            elif 'Casement' in product_name:
                style = 'C'
            
            # 获取客户名
            customer = line.invoice_id.partner_id.name if line.invoice_id and line.invoice_id.partner_id else ''
            # 如果客户名称太长，截取前10个字符加编号
            if customer and len(customer) > 10:
                customer_code = customer[:8] + str(line.invoice_id.id % 100000)
            else:
                customer_code = customer
            
            # 写入行数据
            worksheet.write(row, 0, customer_code, cell_style)    # Customer
            worksheet.write(row, 1, item_id, cell_style)          # ID
            worksheet.write(row, 2, style, cell_style)            # Style
            worksheet.write(row, 3, line.width or '', cell_style) # W
            worksheet.write(row, 4, line.height or '', cell_style) # H
            worksheet.write(row, 5, '', cell_style)               # FH - 留空
            worksheet.write(row, 6, line.frame or '', cell_style) # Frame
            worksheet.write(row, 7, line.glass or '', cell_style) # Glass
            worksheet.write(row, 8, 'Yes' if line.argon else '', cell_style) # Argon
            worksheet.write(row, 9, line.grid or '', cell_style)  # Grid
            worksheet.write(row, 10, line.color or '', cell_style) # Color
            worksheet.write(row, 11, line.notes or '', cell_style) # Note
            worksheet.write(row, 12, item_id, cell_style)         # ID再次
            
            row += 1
            item_id += 1
        
        # 关闭工作簿并获取内容
        workbook.close()
        output.seek(0)
        
        # 保存报表文件
        report_name = f"Cutting_List_{production.batch_number or datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        self.write({
            'report_file': base64.b64encode(output.read()),
            'report_filename': report_name,
            'state': 'done'
        })
        
        return {
            'type': 'ir.actions.act_window',
            'res_model': 'rich_production.cutting.list.report',
            'res_id': self.id,
            'view_mode': 'form',
            'target': 'new',
        }

    def action_preview_report(self):
        """预览报表"""
        self.ensure_one()
        
        # 确保报表已生成
        if self.state != 'done':
            self.generate_report()
            
        # 返回预览URL
        preview_url = f"/rich_production/cutting_list_preview/{self.id}"
        return {
            'type': 'ir.actions.act_url',
            'url': preview_url,
            'target': 'new',
        }
        
    def action_download_excel(self):
        """下载Excel文件"""
        self.ensure_one()
        
        # 确保报表已生成
        if self.state != 'done':
            self.generate_report()
            
        # 返回下载URL
        download_url = f"/rich_production/download_excel/{self.id}"
        return {
            'type': 'ir.actions.act_url',
            'url': download_url,
            'target': 'self',
        }

    @api.model
    def create_for_production(self, production_id):
        """创建下料单报表记录并返回ID - 用于客户端组件调用"""
        if not production_id:
            return False
            
        # 创建报表记录
        report = self.search([('production_id', '=', production_id)], limit=1)
        
        if not report:
            report = self.create({
                'production_id': production_id
            })
            
        # 确保报表已生成
        if report.state != 'done':
            report.generate_report()
            
        return report.id 