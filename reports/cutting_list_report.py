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
        _logger = logging.getLogger(__name__)
        
        if not xlsxwriter:
            raise UserError(_("You need to install the xlsxwriter Python library."))
        
        production = self.production_id
        
        # 创建内存中的Excel工作簿
        output = io.BytesIO()
        workbook = xlsxwriter.Workbook(output)
        
        # 创建不同的工作表
        self._create_general_info_sheet(workbook, production)
        self._create_sash_welder_sheet(workbook, production)
        
        # 创建DECA数据工作表
        deca_worksheet = workbook.add_worksheet('DECA Data')
        styles = self._get_workbook_styles(workbook)
        self._setup_deca_data_sheet(deca_worksheet, styles, production)
        
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
        
        _logger.info(f"Excel报表生成完成")
        
        return {
            'type': 'ir.actions.act_window',
            'res_model': 'rich_production.cutting.list.report',
            'res_id': self.id,
            'view_mode': 'form',
            'target': 'new',
        }
    
    def _get_workbook_styles(self, workbook):
        """创建并返回工作簿中使用的所有样式"""
        styles = {}
        
        styles['title_style'] = workbook.add_format({
            'font_name': 'Arial',
            'font_size': 16,
            'bold': True,
            'align': 'center',
            'valign': 'vcenter',
            'border': 1,
        })
        
        styles['header_style'] = workbook.add_format({
            'font_name': 'Arial',
            'font_size': 12,
            'bold': True,
            'align': 'center',
            'valign': 'vcenter',
            'bg_color': '#D3D3D3',
            'border': 1,
        })
        
        styles['batch_style'] = workbook.add_format({
            'font_name': 'Arial',
            'font_size': 14,
            'bold': True,
            'align': 'left',
            'valign': 'vcenter',
            'border': 1,
        })
        
        styles['cell_style'] = workbook.add_format({
            'font_name': 'Arial',
            'font_size': 11,
            'align': 'center',
            'valign': 'vcenter',
            'border': 1,
            'bg_color': '#F5F5DC',  # 浅米色背景
        })
        
        styles['warning_cell_style'] = workbook.add_format({
            'font_name': 'Arial',
            'font_size': 11,
            'align': 'center',
            'valign': 'vcenter',
            'border': 1,
            'bg_color': '#FFFF00',  # 黄色背景
        })
        
        return styles
    
    def _create_general_info_sheet(self, workbook, production):
        """创建General Information工作表"""
        _logger = logging.getLogger(__name__)
        styles = self._get_workbook_styles(workbook)
        
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
        worksheet.merge_range('G1:L1', 'General Information', styles['title_style'])
        worksheet.merge_range('M1:M1', 'Start', workbook.add_format({'border': 1}))
        
        # 添加批次号
        worksheet.merge_range('A2:B2', 'Batch NO.', styles['batch_style'])
        worksheet.merge_range('C2:F2', production.batch_number or '', styles['batch_style'])
        
        # 添加表头
        headers = ['Customer', 'ID', 'Style', 'W', 'H', 'FH', 'Frame', 'Glass', 'Argon', 'Grid', 'Color', 'Note', 'ID']
        for col, header in enumerate(headers):
            worksheet.write(3, col, header, styles['header_style'])
        
        # 添加产品数据
        row = 4
        item_id = 1
        
        # 获取ProductionLine模型定义，用于检查字段
        ProductionLine = self.env['rich_production.line']
        has_quantity_field = 'quantity' in ProductionLine._fields
        
        _logger.info(f"开始生成Excel报表，生产ID: {production.id}, 产品行数: {len(production.product_line_ids)}")
        
        for line in production.product_line_ids:
            try:
                # 提取产品类型（Style）- 通常在产品名称中包含，如XO, XOX
                product_name = ""
                if line.product_id:
                    product_name = line.product_id.name or ""
                
                style = ""
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
                else:
                    style = product_name
                
                # 获取客户名
                customer_code = ""
                if line.invoice_id and line.invoice_id.partner_id:
                    customer = line.invoice_id.partner_id.name or ""
                    # 如果客户名称太长，截取前10个字符加编号
                    if customer and len(customer) > 10:
                        customer_code = customer[:8] + str(line.invoice_id.id % 100000)
                    else:
                        customer_code = customer
                
                # 确定产品数量
                quantity = 1
                
                # 优先使用quantity字段
                if has_quantity_field and hasattr(line, 'quantity'):
                    try:
                        if line.quantity:
                            quantity = int(float(line.quantity))
                    except (ValueError, TypeError) as e:
                        _logger.warning(f"转换产品行ID {line.id} 的数量失败: {e}")
                
                # 如果没有quantity字段或值无效，尝试使用product_qty字段
                if quantity <= 0 and hasattr(line, 'product_qty'):
                    try:
                        if line.product_qty:
                            quantity = int(float(line.product_qty))
                    except (ValueError, TypeError) as e:
                        _logger.warning(f"转换产品行ID {line.id} 的product_qty失败: {e}")
                
                # 确保数量至少为1
                quantity = max(1, quantity)
                _logger.info(f"产品行ID: {line.id}, 产品: {product_name}, 数量: {quantity}")
                
                # 安全获取字段值，防止缺少字段导致错误
                width = getattr(line, 'width', '') or ''
                height = getattr(line, 'height', '') or ''
                frame = getattr(line, 'frame', '') or ''
                glass = getattr(line, 'glass', '') or ''
                grid = getattr(line, 'grid', '') or ''
                color = getattr(line, 'color', '') or ''
                notes = getattr(line, 'notes', '') or ''
                argon = getattr(line, 'argon', False)
                
                # 为每个数量创建一行
                for i in range(quantity):
                    # 写入行数据
                    worksheet.write(row, 0, customer_code, styles['cell_style'])    # Customer
                    worksheet.write(row, 1, item_id, styles['cell_style'])          # ID
                    worksheet.write(row, 2, style, styles['cell_style'])            # Style
                    worksheet.write(row, 3, width, styles['cell_style'])            # W
                    worksheet.write(row, 4, height, styles['cell_style'])           # H
                    worksheet.write(row, 5, '', styles['cell_style'])               # FH - 留空
                    worksheet.write(row, 6, frame, styles['cell_style'])            # Frame
                    worksheet.write(row, 7, glass, styles['cell_style'])            # Glass
                    worksheet.write(row, 8, 'Yes' if argon else '', styles['cell_style']) # Argon
                    worksheet.write(row, 9, grid, styles['cell_style'])             # Grid
                    worksheet.write(row, 10, color, styles['cell_style'])           # Color
                    worksheet.write(row, 11, notes, styles['cell_style'])           # Notes
                    worksheet.write(row, 12, item_id, styles['cell_style'])         # ID再次
                    
                    row += 1
                    item_id += 1
            except Exception as e:
                _logger.exception(f"处理产品行ID {line.id} 时出错: {e}")
                # 继续处理下一行，不中断报表生成
        
        return worksheet
        
    def _create_sash_welder_sheet(self, workbook, production):
        """创建Sash Welder工作表"""
        _logger = logging.getLogger(__name__)
        styles = self._get_workbook_styles(workbook)
        
        # 创建Sash Welder工作表
        sash_welder_worksheet = workbook.add_worksheet('Sash Welder')
        
        # 设置列宽
        sash_welder_worksheet.set_column('A:A', 15)  # Customer列宽
        sash_welder_worksheet.set_column('B:B', 5)   # ID列宽
        sash_welder_worksheet.set_column('C:C', 8)   # Style列宽
        sash_welder_worksheet.set_column('D:D', 8)   # W列宽
        sash_welder_worksheet.set_column('E:E', 8)   # H列宽
        sash_welder_worksheet.set_column('F:F', 8)   # Sash W列宽
        sash_welder_worksheet.set_column('G:G', 8)   # Sash H列宽
        sash_welder_worksheet.set_column('H:H', 5)   # Pcs列宽
        sash_welder_worksheet.set_column('I:I', 5)   # ID列宽
        
        # 添加标题
        sash_welder_worksheet.merge_range('A1:I1', 'Sash Welding List', styles['title_style'])
        
        # 添加批次号
        sash_welder_worksheet.merge_range('A2:B2', 'Batch NO.', styles['batch_style'])
        sash_welder_worksheet.merge_range('C2:F2', production.batch_number or '', styles['batch_style'])
        
        # 添加表头
        welder_headers = ['Customer', 'ID', 'Style', 'W', 'H', 'Sash W', 'Sash H', 'Pcs', 'ID']
        for col, header in enumerate(welder_headers):
            sash_welder_worksheet.write(3, col, header, styles['header_style'])
            
        # 获取焊接器数据
        welder_rows = []
        try:
            # 获取与此生产订单关联的计算结果
            calculation_results = self.env['window.calculation.result'].search([
                ('production_id', '=', production.id)
            ])
            
            if calculation_results:
                _logger.info(f"找到{len(calculation_results)}个计算结果记录")
                
                # 获取焊接器数据
                welder_data = []
                for result in calculation_results:
                    welder_records = result.welder_ids
                    if welder_records:
                        for welder in welder_records:
                            welder_rows.append({
                                'customer': welder.customer or '',
                                'id': welder.item_id or '',
                                'style': welder.style or '',
                                'width': welder.width or '',
                                'height': welder.height or '',
                                'sash_w': welder.sash_width or 0,
                                'sash_h': welder.sash_height or 0,
                                'pieces': welder.pieces or 1,
                            })
                            
                _logger.info(f"获取到{len(welder_rows)}条焊接器数据")
            else:
                _logger.warning(f"未找到计算结果记录")
                
            # 按客户和款式排序
            welder_rows.sort(key=lambda x: (x.get('customer', ''), x.get('style', '')))
            
            # 写入焊接器数据
            row = 4
            for item in welder_rows:
                sash_welder_worksheet.write(row, 0, item.get('customer', ''), styles['cell_style'])
                sash_welder_worksheet.write(row, 1, item.get('id', ''), styles['cell_style'])
                sash_welder_worksheet.write(row, 2, item.get('style', ''), styles['cell_style'])
                sash_welder_worksheet.write(row, 3, item.get('width', ''), styles['cell_style'])
                sash_welder_worksheet.write(row, 4, item.get('height', ''), styles['cell_style'])
                
                # 条件格式：Sash W < 18 使用黄色背景
                sash_w = item.get('sash_w', 0)
                if sash_w < 18:
                    sash_welder_worksheet.write(row, 5, sash_w, styles['warning_cell_style'])
                else:
                    sash_welder_worksheet.write(row, 5, sash_w, styles['cell_style'])
                
                # 条件格式：Sash H < 15 或 > 54 使用黄色背景
                sash_h = item.get('sash_h', 0)
                if sash_h < 15 or sash_h > 54:
                    sash_welder_worksheet.write(row, 6, sash_h, styles['warning_cell_style'])
                else:
                    sash_welder_worksheet.write(row, 6, sash_h, styles['cell_style'])
                
                sash_welder_worksheet.write(row, 7, item.get('pieces', 1), styles['cell_style'])
                sash_welder_worksheet.write(row, 8, item.get('id', ''), styles['cell_style'])
                
                row += 1
                
        except Exception as e:
            _logger.exception(f"生成焊接器表格时出错: {e}")
            
        return sash_welder_worksheet
    
    def _setup_deca_data_sheet(self, worksheet, styles, production):
        """设置DECA数据工作表的内容"""
        _logger = logging.getLogger(__name__)
        
        # 设置列宽
        worksheet.set_column('A:A', 15)  # Batch No列宽
        worksheet.set_column('B:B', 15)  # Order No列宽
        worksheet.set_column('C:C', 12)  # Order Item列宽
        worksheet.set_column('D:D', 15)  # Material Name列宽
        worksheet.set_column('E:E', 15)  # Cutting ID Pieces ID列宽
        worksheet.set_column('F:F', 10)  # Length列宽
        worksheet.set_column('G:G', 10)  # Angles列宽
        worksheet.set_column('H:H', 10)  # Qty列宽
        worksheet.set_column('I:I', 10)  # Bin No列宽
        worksheet.set_column('J:J', 10)  # Cart No列宽
        worksheet.set_column('K:K', 15)  # Position列宽
        worksheet.set_column('L:L', 12)  # Label Print列宽
        worksheet.set_column('M:M', 15)  # Barcode No列宽
        worksheet.set_column('N:N', 10)  # PO No列宽
        worksheet.set_column('O:O', 10)  # Style列宽
        worksheet.set_column('P:P', 10)  # Frame列宽
        worksheet.set_column('Q:Q', 15)  # Product Size列宽
        worksheet.set_column('R:R', 10)  # Color列宽
        worksheet.set_column('S:S', 10)  # Grid列宽
        worksheet.set_column('T:T', 10)  # Glass列宽
        worksheet.set_column('U:U', 10)  # Argon列宽
        worksheet.set_column('V:V', 12)  # Painting列宽
        worksheet.set_column('W:W', 15)  # Product Dimensions列宽
        worksheet.set_column('X:X', 10)  # Balance列宽
        worksheet.set_column('Y:Y', 10)  # Shift列宽
        worksheet.set_column('Z:Z', 15)  # Ship date列宽
        worksheet.set_column('AA:AA', 15)  # Note列宽
        worksheet.set_column('AB:AB', 15)  # Customer列宽
        
        # 添加标题
        worksheet.merge_range('A1:AB1', 'DECA Data', styles['title_style'])
        
        # 添加批次号
        worksheet.merge_range('A2:B2', 'Batch NO.', styles['batch_style'])
        worksheet.merge_range('C2:F2', production.batch_number or '', styles['batch_style'])
        
        # 添加表头
        headers = ['Batch No', 'Order No', 'Order Item', 'Material Name', 'Cutting ID Pieces ID', 
                  'Length', 'Angles', 'Qty', 'Bin No', 'Cart No', 'Position', 'Label Print', 
                  'Barcode No', 'PO No', 'Style', 'Frame', 'Product Size', 'Color', 'Grid', 
                  'Glass', 'Argon', 'Painting', 'Product Dimensions', 'Balance', 'Shift', 
                  'Ship date', 'Note', 'Customer']
        for col, header in enumerate(headers):
            worksheet.write(3, col, header, styles['header_style'])
            
        # 获取DECA数据
        try:
            # 从计算结果中获取框架数据并转换为DECA数据格式
            row = 4
            if production.result_ids:
                for result in production.result_ids:
                    if result.frame_ids:
                        # 获取窗户基本信息
                        style = ''
                        color = ''
                        grid = ''
                        glass = ''
                        argon = False
                        product_size = ''
                        customer = ''
                        
                        if result.general_info_ids:
                            general_info = result.general_info_ids[0]
                            style = general_info.style or ''
                            color = general_info.color or ''
                            grid = general_info.grid or ''
                            glass = general_info.glass or ''
                            argon = general_info.argon or False
                            customer = general_info.customer or ''
                            if general_info.width and general_info.height:
                                product_size = f"{general_info.width}x{general_info.height}"
                        
                        # 处理每个框架数据
                        for frame in result.frame_ids:
                            # 确定位置
                            position = 'TOP+BOT'
                            if frame.position == '|':
                                position = 'LEFT+RIGHT'
                            elif frame.position == '--':
                                position = 'TOP+BOT'
                            else:
                                position = frame.position
                            
                            # 填充DECA数据行
                            worksheet.write(row, 0, production.batch_number or '', styles['cell_style'])  # Batch No
                            worksheet.write(row, 1, production.id or '', styles['cell_style'])  # Order No
                            worksheet.write(row, 2, frame.item_id or '', styles['cell_style'])  # Order Item
                            worksheet.write(row, 3, frame.material or '', styles['cell_style'])  # Material Name
                            worksheet.write(row, 4, '', styles['cell_style'])  # Cutting ID Pieces ID
                            worksheet.write(row, 5, frame.length or '', styles['cell_style'])  # Length
                            worksheet.write(row, 6, 'V' if frame.position == '|' else 'H', styles['cell_style'])  # Angles
                            worksheet.write(row, 7, frame.quantity or 1, styles['cell_style'])  # Qty
                            worksheet.write(row, 8, production.id or '', styles['cell_style'])  # Bin No
                            worksheet.write(row, 9, '', styles['cell_style'])  # Cart No
                            worksheet.write(row, 10, position, styles['cell_style'])  # Position
                            worksheet.write(row, 11, '', styles['cell_style'])  # Label Print
                            worksheet.write(row, 12, '', styles['cell_style'])  # Barcode No
                            worksheet.write(row, 13, '', styles['cell_style'])  # PO No
                            worksheet.write(row, 14, style, styles['cell_style'])  # Style
                            worksheet.write(row, 15, frame.material or '', styles['cell_style'])  # Frame
                            worksheet.write(row, 16, product_size, styles['cell_style'])  # Product Size
                            worksheet.write(row, 17, color, styles['cell_style'])  # Color
                            worksheet.write(row, 18, grid, styles['cell_style'])  # Grid
                            worksheet.write(row, 19, glass, styles['cell_style'])  # Glass
                            worksheet.write(row, 20, 'Yes' if argon else '', styles['cell_style'])  # Argon
                            worksheet.write(row, 21, '', styles['cell_style'])  # Painting
                            worksheet.write(row, 22, '', styles['cell_style'])  # Product Dimensions
                            worksheet.write(row, 23, '', styles['cell_style'])  # Balance
                            worksheet.write(row, 24, '', styles['cell_style'])  # Shift
                            worksheet.write(row, 25, '', styles['cell_style'])  # Ship date
                            worksheet.write(row, 26, '', styles['cell_style'])  # Note
                            worksheet.write(row, 27, customer, styles['cell_style'])  # Customer
                            
                            row += 1
        except Exception as e:
            _logger.exception(f"生成DECA数据表格时出错: {e}")
    
    def generate_single_sheet_report(self, sheet_name):
        """生成单个工作表的Excel报表"""
        self.ensure_one()
        _logger = logging.getLogger(__name__)
        
        if not xlsxwriter:
            raise UserError(_("You need to install the xlsxwriter Python library."))
        
        production = self.production_id
        
        # 创建内存中的Excel工作簿
        output = io.BytesIO()
        workbook = xlsxwriter.Workbook(output)
        
        # 根据要求创建单个工作表
        if sheet_name == 'general_info':
            self._create_general_info_sheet(workbook, production)
            filename = f"General_Info_{production.batch_number or datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        elif sheet_name == 'sash_welder':
            self._create_sash_welder_sheet(workbook, production)
            filename = f"Sash_Welder_{production.batch_number or datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        elif sheet_name == 'frame_data':
            # 创建框架数据工作表
            worksheet = workbook.add_worksheet('Frame Data')
            styles = self._get_workbook_styles(workbook)
            
            # 设置表头和数据
            self._setup_frame_data_sheet(worksheet, styles, production)
            filename = f"Frame_Data_{production.batch_number or datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        elif sheet_name == 'sash_data':
            # 创建嵌扇数据工作表
            worksheet = workbook.add_worksheet('Sash Data')
            styles = self._get_workbook_styles(workbook)
            
            # 设置表头和数据
            self._setup_sash_data_sheet(worksheet, styles, production)
            filename = f"Sash_Data_{production.batch_number or datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        elif sheet_name == 'screen_data':
            # 创建纱窗数据工作表
            worksheet = workbook.add_worksheet('Screen Data')
            styles = self._get_workbook_styles(workbook)
            
            # 设置表头和数据
            self._setup_screen_data_sheet(worksheet, styles, production)
            filename = f"Screen_Data_{production.batch_number or datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        elif sheet_name == 'parts_data':
            # 创建零部件数据工作表
            worksheet = workbook.add_worksheet('Parts Data')
            styles = self._get_workbook_styles(workbook)
            
            # 设置表头和数据
            self._setup_parts_data_sheet(worksheet, styles, production)
            filename = f"Parts_Data_{production.batch_number or datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        elif sheet_name == 'grid_data':
            # 创建网格数据工作表
            worksheet = workbook.add_worksheet('Grid Data')
            styles = self._get_workbook_styles(workbook)
            
            # 设置表头和数据
            self._setup_grid_data_sheet(worksheet, styles, production)
            filename = f"Grid_Data_{production.batch_number or datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        elif sheet_name == 'glass_data':
            # 创建玻璃数据工作表
            worksheet = workbook.add_worksheet('Glass Data')
            styles = self._get_workbook_styles(workbook)
            
            # 设置表头和数据
            self._setup_glass_data_sheet(worksheet, styles, production)
            filename = f"Glass_Data_{production.batch_number or datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        elif sheet_name == 'deca_data':
            # 创建DECA数据工作表
            worksheet = workbook.add_worksheet('DECA Data')
            styles = self._get_workbook_styles(workbook)
            
            # 设置表头和数据
            self._setup_deca_data_sheet(worksheet, styles, production)
            filename = f"DECA_Data_{production.batch_number or datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        else:
            raise UserError(_("不支持的工作表名称"))
        
        # 关闭工作簿并获取内容
        workbook.close()
        output.seek(0)
        
        return {
            'file_content': base64.b64encode(output.read()),
            'filename': filename
        }
    
    def _setup_frame_data_sheet(self, worksheet, styles, production):
        """设置框架数据工作表的内容"""
        _logger = logging.getLogger(__name__)
        
        # 设置列宽
        worksheet.set_column('A:A', 15)  # Batch列宽
        worksheet.set_column('B:B', 8)   # Style列宽
        worksheet.set_column('C:L', 12)  # Frame数据列宽
        worksheet.set_column('M:M', 10)  # Color列宽
        worksheet.set_column('N:N', 5)   # ID列宽
        
        # 添加标题
        worksheet.merge_range('A1:N1', 'Frame Data', styles['title_style'])
        
        # 添加批次号
        worksheet.merge_range('A2:B2', 'Batch NO.', styles['batch_style'])
        worksheet.merge_range('C2:F2', production.batch_number or '', styles['batch_style'])
        
        # 添加表头
        headers = ['Batch', 'Style', '82-02B--', '82-02BPcs', '82-02B|', '82-02B|Pcs', 
                  '82-10--', '82-10Pcs', '82-10|', '82-10|Pcs', 
                  '82-01--', '82-01Pcs', '82-01|', '82-01|Pcs', 'Color', 'ID']
        for col, header in enumerate(headers):
            worksheet.write(3, col, header, styles['header_style'])
            
        # 获取框架数据
        try:
            # 从计算结果中获取框架数据
            row = 4
            if production.result_ids:
                # 收集所有框架数据
                frame_data = []
                for result in production.result_ids:
                    if result.frame_ids:
                        # 按材料和位置整理框架数据
                        frame_summary = {}
                        for frame in result.frame_ids:
                            key = f"{frame.material}--{frame.position}"
                            if key not in frame_summary:
                                frame_summary[key] = {
                                    'length': 0,
                                    'quantity': 0
                                }
                            frame_summary[key]['length'] += frame.length or 0
                            frame_summary[key]['quantity'] += frame.quantity or 0
                        
                        # 获取窗户风格
                        style = ''
                        if result.general_info_ids:
                            style = result.general_info_ids[0].style or ''
                        
                        # 收集颜色信息
                        color = ''
                        if result.general_info_ids:
                            color = result.general_info_ids[0].color or ''
                        
                        # 添加到框架数据列表
                        frame_data.append({
                            'batch': production.batch_number or '',
                            'style': style,
                            '82-02B--': self._get_frame_length(frame_summary, '82-02B', '--'),
                            '82-02BPcs': self._get_frame_quantity(frame_summary, '82-02B', '--'),
                            '82-02B|': self._get_frame_length(frame_summary, '82-02B', '|'),
                            '82-02B|Pcs': self._get_frame_quantity(frame_summary, '82-02B', '|'),
                            '82-10--': self._get_frame_length(frame_summary, '82-10', '--'),
                            '82-10Pcs': self._get_frame_quantity(frame_summary, '82-10', '--'),
                            '82-10|': self._get_frame_length(frame_summary, '82-10', '|'),
                            '82-10|Pcs': self._get_frame_quantity(frame_summary, '82-10', '|'),
                            '82-01--': self._get_frame_length(frame_summary, '82-01', '--'),
                            '82-01Pcs': self._get_frame_quantity(frame_summary, '82-01', '--'),
                            '82-01|': self._get_frame_length(frame_summary, '82-01', '|'),
                            '82-01|Pcs': self._get_frame_quantity(frame_summary, '82-01', '|'),
                            'color': color,
                            'id': result.id,
                        })
                
                # 将数据写入工作表
                for item in frame_data:
                    for col, field in enumerate(headers):
                        worksheet.write(row, col, item.get(field, ''), styles['cell_style'])
                    row += 1
        except Exception as e:
            _logger.exception(f"生成框架数据表格时出错: {e}")
    
    def _get_frame_length(self, frame_summary, material, position):
        """获取指定材料和位置的框架长度"""
        key = f"{material}--{position}"
        if key in frame_summary:
            return frame_summary[key]['length']
        return 0
    
    def _get_frame_quantity(self, frame_summary, material, position):
        """获取指定材料和位置的框架数量"""
        key = f"{material}--{position}"
        if key in frame_summary:
            return frame_summary[key]['quantity']
        return 0
    
    def _setup_sash_data_sheet(self, worksheet, styles, production):
        """设置嵌扇数据工作表的内容"""
        _logger = logging.getLogger(__name__)
        
        # 设置列宽
        worksheet.set_column('A:A', 15)  # Customer列宽
        worksheet.set_column('B:B', 5)   # ID列宽
        worksheet.set_column('C:C', 8)   # Style列宽
        worksheet.set_column('D:G', 10)  # 尺寸列宽
        worksheet.set_column('H:H', 10)  # Color列宽
        
        # 添加标题
        worksheet.merge_range('A1:H1', 'Sash Data', styles['title_style'])
        
        # 添加批次号
        worksheet.merge_range('A2:B2', 'Batch NO.', styles['batch_style'])
        worksheet.merge_range('C2:F2', production.batch_number or '', styles['batch_style'])
        
        # 添加表头
        headers = ['Customer', 'ID', 'Style', 'H--', 'H--Pcs', 'V|', 'V|Pcs', 'Color']
        for col, header in enumerate(headers):
            worksheet.write(3, col, header, styles['header_style'])
            
        # 获取嵌扇数据
        try:
            # 实现嵌扇数据获取和写入的逻辑
            # 类似于_setup_frame_data_sheet方法的实现
            pass
        except Exception as e:
            _logger.exception(f"生成嵌扇数据表格时出错: {e}")
    
    def _setup_screen_data_sheet(self, worksheet, styles, production):
        """设置纱窗数据工作表的内容"""
        _logger = logging.getLogger(__name__)
        
        # 设置列宽
        worksheet.set_column('A:A', 15)  # Customer列宽
        worksheet.set_column('B:B', 5)   # ID列宽
        worksheet.set_column('C:C', 8)   # Style列宽
        worksheet.set_column('D:G', 10)  # 尺寸列宽
        worksheet.set_column('H:H', 10)  # Color列宽
        worksheet.set_column('I:I', 5)   # ID列宽
        
        # 添加标题
        worksheet.merge_range('A1:I1', 'Screen Data', styles['title_style'])
        
        # 添加批次号
        worksheet.merge_range('A2:B2', 'Batch NO.', styles['batch_style'])
        worksheet.merge_range('C2:F2', production.batch_number or '', styles['batch_style'])
        
        # 添加表头
        headers = ['Customer', 'ID', 'Style', 'Screen W', 'Screen W Pcs', 'Screen H', 'Screen H Pcs', 'Color', 'ID']
        for col, header in enumerate(headers):
            worksheet.write(3, col, header, styles['header_style'])
            
        # 获取纱窗数据
        try:
            # 实现纱窗数据获取和写入的逻辑
            pass
        except Exception as e:
            _logger.exception(f"生成纱窗数据表格时出错: {e}")
    
    def _setup_parts_data_sheet(self, worksheet, styles, production):
        """设置零部件数据工作表的内容"""
        _logger = logging.getLogger(__name__)
        
        # 设置列宽和表头
        # 实现零部件数据表格的设置
        pass
    
    def _setup_grid_data_sheet(self, worksheet, styles, production):
        """设置网格数据工作表的内容"""
        _logger = logging.getLogger(__name__)
        
        # 设置列宽和表头
        # 实现网格数据表格的设置
        pass
    
    def _setup_glass_data_sheet(self, worksheet, styles, production):
        """设置玻璃数据工作表的内容"""
        _logger = logging.getLogger(__name__)
        
        # 设置列宽
        worksheet.set_column('A:A', 15)  # Customer列宽
        worksheet.set_column('B:B', 8)   # Style列宽
        worksheet.set_column('C:E', 8)   # 尺寸列宽
        worksheet.set_column('F:F', 5)   # ID列宽
        worksheet.set_column('G:G', 5)   # Line #列宽
        worksheet.set_column('H:H', 8)   # Quantity列宽
        worksheet.set_column('I:I', 15)  # Glass Type列宽
        worksheet.set_column('J:K', 8)   # Tmprd/Thick列宽
        worksheet.set_column('L:M', 10)  # Width/Height列宽
        worksheet.set_column('N:O', 8)   # Grid/Argon列宽
        worksheet.set_column('P:P', 5)   # ID列宽
        
        # 添加标题
        worksheet.merge_range('A1:P1', 'Glass Data', styles['title_style'])
        
        # 添加批次号
        worksheet.merge_range('A2:B2', 'Batch NO.', styles['batch_style'])
        worksheet.merge_range('C2:F2', production.batch_number or '', styles['batch_style'])
        
        # 添加表头
        headers = ['Customer', 'Style', 'W', 'H', 'FH', 'ID', 'Line #', 'Quantity', 
                  'Glass Type', 'Tmprd', 'Thick', 'Width', 'Height', 'Grid', 'Argon', 'ID']
        for col, header in enumerate(headers):
            worksheet.write(3, col, header, styles['header_style'])
            
        # 获取玻璃数据
        try:
            # 实现玻璃数据获取和写入的逻辑
            pass
        except Exception as e:
            _logger.exception(f"生成玻璃数据表格时出错: {e}")
    
    def action_download_general_info(self):
        """下载General Information工作表"""
        self.ensure_one()
        result = self.generate_single_sheet_report('general_info')
        
        # 保存临时文件
        attachment = self.env['ir.attachment'].create({
            'name': result['filename'],
            'datas': result['file_content'],
            'type': 'binary',
        })
        
        # 返回下载URL
        return {
            'type': 'ir.actions.act_url',
            'url': f"/web/content/{attachment.id}?download=true",
            'target': 'self',
        }
    
    def action_download_sash_welder(self):
        """下载Sash Welder工作表"""
        self.ensure_one()
        result = self.generate_single_sheet_report('sash_welder')
        
        # 保存临时文件
        attachment = self.env['ir.attachment'].create({
            'name': result['filename'],
            'datas': result['file_content'],
            'type': 'binary',
        })
        
        # 返回下载URL
        return {
            'type': 'ir.actions.act_url',
            'url': f"/web/content/{attachment.id}?download=true",
            'target': 'self',
        }

    def action_download_deca_data(self):
        """下载DECA Data工作表"""
        self.ensure_one()
        result = self.generate_single_sheet_report('deca_data')
        
        # 保存临时文件
        attachment = self.env['ir.attachment'].create({
            'name': result['filename'],
            'datas': result['file_content'],
            'type': 'binary',
        })
        
        # 返回下载URL
        return {
            'type': 'ir.actions.act_url',
            'url': f"/web/content/{attachment.id}?download=true",
            'target': 'self',
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
        """通过生产ID创建并返回报表ID - 用于前端ORM调用"""
        if not production_id:
            return False
            
        # 检查是否已存在该生产记录的报表
        existing_report = self.search([('production_id', '=', production_id)], limit=1)
        if existing_report:
            # 确保报表已生成
            if existing_report.state != 'done':
                existing_report.generate_report()
            return existing_report.id
            
        # 创建新报表
        new_report = self.create({
            'production_id': production_id
        })
        
        # 生成报表内容
        new_report.generate_report()
        
        return new_report.id 