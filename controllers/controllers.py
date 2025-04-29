# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request, content_disposition
import io
import base64
from werkzeug.wrappers import Response
import logging
from datetime import datetime
import json

class RichProduction(http.Controller):
    
    @http.route('/rich_production/cutting_list_preview/<int:report_id>', type='http', auth='user')
    def cutting_list_preview(self, report_id, **kw):
        """预览下料单HTML格式"""
        _logger = logging.getLogger(__name__)
        report = request.env['rich_production.cutting.list.report'].browse(report_id)
        if not report.exists():
            return request.not_found()
            
        production = report.production_id
        
        # 确保报表已生成
        if report.state != 'done':
            # 重新生成报表
            report.generate_report()
            
        # 获取产品行数据
        product_lines = []
        item_id = 1
        
        for line in production.product_line_ids:
            # 尝试使用不同的字段名获取产品数量
            quantity = 1  # 默认为1
            
            # 首先尝试quantity字段
            if hasattr(line, 'quantity') and line.quantity:
                try:
                    quantity = int(float(line.quantity))
                except (ValueError, TypeError):
                    _logger.warning(f"无法转换数量值: {line.quantity}")
            
            # 然后尝试product_qty字段
            elif hasattr(line, 'product_qty') and line.product_qty:
                try:
                    quantity = int(float(line.product_qty))
                except (ValueError, TypeError):
                    _logger.warning(f"无法转换数量值: {line.product_qty}")
            
            # 确保最小数量为1
            quantity = max(1, quantity)
            _logger.info(f"产品行 {line.id} 数量: {quantity}")
            
            # 提取产品类型（Style）
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
            else:
                style = product_name
            
            # 获取客户名
            customer = line.invoice_id.partner_id.name if line.invoice_id and line.invoice_id.partner_id else ''
            # 如果客户名称太长，截取前10个字符加编号
            if customer and len(customer) > 10:
                customer_code = customer[:8] + str(line.invoice_id.id % 100000)
            else:
                customer_code = customer
            
            # 为每个数量创建一行
            for i in range(quantity):
                # 添加产品行数据
                product_lines.append({
                    'id': item_id,
                    'customer': customer_code,
                    'style': style,
                    'width': line.width or '',
                    'height': line.height or '',
                    'fh': '',
                    'frame': line.frame or '',
                    'glass': line.glass or '',
                    'argon': 'Yes' if line.argon else '',
                    'grid': line.grid or '',
                    'color': line.color or '',
                    'note': line.notes or '',
                })
                
                item_id += 1
        
        # 渲染模板
        return request.render('rich_production.cutting_list_preview_template', {
            'production': production,
            'product_lines': product_lines,
            'report': report,
        })
    
    @http.route('/rich_production/download_excel/<int:report_id>', type='http', auth='user', methods=['GET', 'POST'])
    def download_excel(self, report_id, **kw):
        """下载Excel文件"""
        _logger = logging.getLogger(__name__)
        _logger.info(f"下载Excel请求，ID: {report_id}, 方法: {request.httprequest.method}, 参数: {kw}")
        
        try:
            # 先尝试获取报表记录
            report = request.env['rich_production.cutting.list.report'].sudo().browse(report_id)
            
            # 如果找不到报表或报表文件为空，可能是报表ID实际上是生产ID
            if not report.exists() or not report.report_file:
                _logger.info(f"报表 {report_id} 不存在或为空，尝试获取生产记录")
                # 尝试通过生产ID查找或创建报表
                production = request.env['rich_production.production'].sudo().browse(report_id)
                if production.exists():
                    _logger.info(f"找到生产记录: {production.name or '无名称'}, ID: {production.id}")
                    report = request.env['rich_production.cutting.list.report'].sudo().search(
                        [('production_id', '=', production.id)], limit=1)
                    
                    if not report:
                        _logger.info(f"为生产ID {production.id} 创建新报表")
                        # 创建新报表
                        report = request.env['rich_production.cutting.list.report'].sudo().create({
                            'production_id': production.id
                        })
                    
                    # 确保报表已生成
                    if report.state != 'done' or not report.report_file:
                        _logger.info(f"生成报表 (ID: {report.id})")
                        report.sudo().generate_report()
                else:
                    _logger.warning(f"找不到生产记录 ID: {report_id}")
                    return request.not_found()
                    
            # 重新检查报表文件是否存在
            if not report.report_file:
                _logger.error(f"报表文件生成失败 (ID: {report.id})")
                return Response(
                    "报表文件生成失败，请重试", 
                    status=500,
                    headers=[('Content-Type', 'text/plain')]
                )
                
            # 解码Excel文件内容
            file_content = base64.b64decode(report.report_file)
            filename = report.report_filename or f'cutting_list_{report_id}.xlsx'
            _logger.info(f"成功获取Excel文件，大小: {len(file_content)} 字节, 文件名: {filename}")
            
            # 设置下载响应头
            headers = [
                ('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
                ('Content-Disposition', f'attachment; filename="{filename}"'),
                ('Content-Length', str(len(file_content))),
                ('Cache-Control', 'no-cache, no-store, must-revalidate'),
                ('Pragma', 'no-cache'),
                ('Expires', '0'),
            ]
            
            # 返回文件下载响应
            return request.make_response(file_content, headers=headers)
        except Exception as e:
            _logger.exception(f"下载Excel文件时出错: {str(e)}")
            return Response(
                f"下载Excel文件时出错: {str(e)}", 
                status=500,
                headers=[('Content-Type', 'text/plain')]
            )
    
    @http.route('/rich_production/download_sheet/<int:report_id>/<string:sheet_name>', type='http', auth='user')
    def download_sheet(self, report_id, sheet_name, **kw):
        """下载单个工作表的Excel文件"""
        _logger = logging.getLogger(__name__)
        _logger.info(f"下载单个工作表请求，报表ID: {report_id}, 工作表: {sheet_name}")
        
        try:
            # 获取报表记录
            report = request.env['rich_production.cutting.list.report'].sudo().browse(report_id)
            
            if not report.exists():
                _logger.warning(f"报表 {report_id} 不存在")
                return request.not_found()
            
            # 生成单个工作表报表
            result = report.sudo().generate_single_sheet_report(sheet_name)
            
            if not result or not result.get('file_content'):
                raise Exception(f"生成工作表 {sheet_name} 失败")
            
            # 解码Excel文件内容
            file_content = base64.b64decode(result['file_content'])
            filename = result['filename']
            
            _logger.info(f"成功生成工作表 {sheet_name}，大小: {len(file_content)} 字节, 文件名: {filename}")
            
            # 设置下载响应头
            headers = [
                ('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
                ('Content-Disposition', f'attachment; filename="{filename}"'),
                ('Content-Length', str(len(file_content))),
                ('Cache-Control', 'no-cache, no-store, must-revalidate'),
                ('Pragma', 'no-cache'),
                ('Expires', '0'),
            ]
            
            # 返回文件下载响应
            return request.make_response(file_content, headers=headers)
        except Exception as e:
            _logger.exception(f"下载工作表 {sheet_name} 时出错: {str(e)}")
            return Response(
                f"下载工作表时出错: {str(e)}", 
                status=500,
                headers=[('Content-Type', 'text/plain')]
            )
    
    @http.route('/rich_production/print_pdf/<int:report_id>', type='http', auth='user', methods=['GET', 'POST'])
    def print_pdf(self, report_id, **kw):
        """打印PDF版本"""
        _logger = logging.getLogger(__name__)
        _logger.info(f"下载PDF请求，ID: {report_id}, 方法: {request.httprequest.method}, 参数: {kw}")
        
        try:
            # 先尝试获取报表记录
            report = request.env['rich_production.cutting.list.report'].sudo().browse(report_id)
            
            # 如果找不到报表，可能是报表ID实际上是生产ID
            if not report.exists():
                _logger.info(f"报表 {report_id} 不存在，尝试获取生产记录")
                # 尝试通过生产ID查找或创建报表
                production = request.env['rich_production.production'].sudo().browse(report_id)
                if production.exists():
                    _logger.info(f"找到生产记录: {production.name or '无名称'}, ID: {production.id}")
                    report = request.env['rich_production.cutting.list.report'].sudo().search(
                        [('production_id', '=', production.id)], limit=1)
                    
                    if not report:
                        _logger.info(f"为生产ID {production.id} 创建新报表")
                        # 创建新报表
                        report = request.env['rich_production.cutting.list.report'].sudo().create({
                            'production_id': production.id
                        })
                    
                    # 确保报表已生成
                    if report.state != 'done':
                        _logger.info(f"生成报表 (ID: {report.id})")
                        report.sudo().generate_report()
                else:
                    _logger.warning(f"找不到生产记录 ID: {report_id}")
                    return request.not_found()
            
            production = report.production_id
            _logger.info(f"开始生成PDF，生产记录: {production.name or '无名称'}, ID: {production.id}")
            
            try:
                # 直接根据报表中的数据生成PDF
                pdf_content = self._generate_pdf_from_production(production)
                filename = f'Cutting_List_{production.batch_number or production.id}.pdf'
                _logger.info(f"成功生成PDF，大小: {len(pdf_content)} 字节，文件名: {filename}")
                
                # 设置PDF下载响应头
                pdf_http_headers = [
                    ('Content-Type', 'application/pdf'),
                    ('Content-Disposition', f'attachment; filename="{filename}"'),
                    ('Content-Length', str(len(pdf_content))),
                    ('Cache-Control', 'no-cache, no-store, must-revalidate'),
                    ('Pragma', 'no-cache'),
                    ('Expires', '0'),
                ]
                
                return request.make_response(pdf_content, headers=pdf_http_headers)
            except Exception as e:
                # 记录错误并返回错误响应
                _logger.exception(f"生成PDF时出错: {str(e)}")
                
                return Response(
                    f"生成PDF失败: {str(e)}", 
                    status=500,
                    headers=[('Content-Type', 'text/plain')]
                )
        except Exception as e:
            _logger.exception(f"处理PDF请求时出错: {str(e)}")
            return Response(
                f"处理PDF请求时出错: {str(e)}", 
                status=500,
                headers=[('Content-Type', 'text/plain')]
            )
            
    def _generate_pdf_from_production(self, production):
        """从生产记录生成PDF内容"""
        _logger = logging.getLogger(__name__)
        
        try:
            # 首先尝试使用Odoo的QWeb报表引擎
            if hasattr(request.env, 'ref') and request.env.ref('rich_production.action_cutting_list_pdf_report', False):
                _logger.info("使用Odoo QWeb引擎生成PDF")
                pdf_content, _ = request.env.ref('rich_production.action_cutting_list_pdf_report').sudo()._render_qweb_pdf([production.id])
                return pdf_content
        except Exception as e:
            _logger.warning(f"使用QWeb生成PDF失败，尝试使用ReportLab: {str(e)}")
            # 如果QWeb失败，继续使用ReportLab
            
        # 使用ReportLab手动生成PDF
        _logger.info("使用ReportLab生成PDF")
        try:
            import io
            from reportlab.lib.pagesizes import letter, A4
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib import colors
            from reportlab.lib.units import inch, cm
            
            # 创建PDF文档 - 使用A4尺寸
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4, 
                                  leftMargin=1*cm, rightMargin=1*cm,
                                  topMargin=1*cm, bottomMargin=1*cm)
            elements = []
            
            # 创建样式
            styles = getSampleStyleSheet()
            title_style = ParagraphStyle(
                'TitleStyle',
                parent=styles['Title'],
                fontSize=16,
                alignment=1,  # 居中
                spaceAfter=12
            )
            
            # 添加标题
            elements.append(Paragraph(f"Cutting List - {production.batch_number or ''}", title_style))
            elements.append(Spacer(1, 0.5*cm))
            
            # 获取产品行数据
            data = [['Customer', 'ID', 'Style', 'W', 'H', 'FH', 'Frame', 'Glass', 'Argon', 'Grid', 'Color', 'Note', 'ID']]
            
            item_id = 1
            for line in production.product_line_ids:
                # 尝试使用不同的字段名获取产品数量
                quantity = 1  # 默认为1
                
                # 首先尝试quantity字段
                if hasattr(line, 'quantity') and line.quantity:
                    try:
                        quantity = int(float(line.quantity))
                    except (ValueError, TypeError):
                        _logger.warning(f"无法转换数量值: {line.quantity}")
                
                # 然后尝试product_qty字段
                elif hasattr(line, 'product_qty') and line.product_qty:
                    try:
                        quantity = int(float(line.product_qty))
                    except (ValueError, TypeError):
                        _logger.warning(f"无法转换数量值: {line.product_qty}")
                
                # 确保最小数量为1
                quantity = max(1, quantity)
                _logger.info(f"产品行 {line.id} 数量: {quantity}")
                
                # 提取产品类型
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
                else:
                    style = product_name
                
                # 获取客户名
                customer = line.invoice_id.partner_id.name if line.invoice_id and line.invoice_id.partner_id else ''
                # 如果客户名称太长，截取前10个字符加编号
                if customer and len(customer) > 10:
                    customer_code = customer[:8] + str(line.invoice_id.id % 100000)
                else:
                    customer_code = customer
                
                # 为每个数量创建一行
                for i in range(quantity):
                    # 添加行数据
                    row = [
                        customer_code,
                        item_id,  # ID
                        style,
                        line.width or '',
                        line.height or '',
                        '',  # FH
                        line.frame or '',
                        line.glass or '',
                        'Yes' if line.argon else '',
                        line.grid or '',
                        line.color or '',
                        line.notes or '',
                        item_id,  # ID again
                    ]
                    data.append(row)
                    item_id += 1
            
            # 创建表格
            if len(data) == 1:  # 只有标题行
                data.append(['No data'] + [''] * 12)  # 添加一个空行
                
            # 设置列宽
            col_widths = [2*cm, 0.8*cm, 1*cm, 1*cm, 1*cm, 0.8*cm, 1.5*cm, 1.5*cm, 1*cm, 1*cm, 1*cm, 2*cm, 0.8*cm]
            table = Table(data, colWidths=col_widths)
            
            # 设置表格样式
            style = TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
            ])
            table.setStyle(style)
            
            # 添加表格到文档
            elements.append(table)
            
            # 构建PDF
            doc.build(elements)
            
            # 获取生成的PDF内容
            pdf_content = buffer.getvalue()
            buffer.close()
            
            _logger.info(f"ReportLab成功生成PDF，大小: {len(pdf_content)} 字节")
            return pdf_content
            
        except Exception as e:
            _logger.exception(f"使用ReportLab生成PDF时出错: {str(e)}")
            # 如果ReportLab也失败，创建一个简单的错误PDF
            try:
                from reportlab.pdfgen import canvas
                buffer = io.BytesIO()
                c = canvas.Canvas(buffer)
                c.drawString(100, 750, f"Error generating PDF: {str(e)}")
                c.showPage()
                c.save()
                return buffer.getvalue()
            except:
                # 最后的后备方案 - 返回一个空PDF（至少可以下载）
                return b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 595 842]/Resources<<>>/Parent 2 0 R>>endobj\ntrailer<</Size 4/Root 1 0 R>>\n%%EOF"
    
    @http.route('/rich_production/cutting_list_preview_embed/<int:production_id>', type='http', auth='user')
    def cutting_list_preview_embed(self, production_id, **kw):
        """用于嵌入式显示的下料单预览"""
        _logger = logging.getLogger(__name__)
        production = request.env['rich_production.production'].browse(production_id)
        if not production.exists():
            return request.not_found()
            
        # 创建报表记录(如果不存在)
        report = request.env['rich_production.cutting.list.report'].search(
            [('production_id', '=', production_id)], limit=1)
        if not report:
            report = request.env['rich_production.cutting.list.report'].create({
                'production_id': production_id
            })
        # 确保报表已生成
        if report.state != 'done':
            report.generate_report()
            
        # 获取产品行数据
        product_lines = []
        item_id = 1
        
        for line in production.product_line_ids:
            # 尝试使用不同的字段名获取产品数量
            quantity = 1  # 默认为1
            
            # 首先尝试quantity字段
            if hasattr(line, 'quantity') and line.quantity:
                try:
                    quantity = int(float(line.quantity))
                except (ValueError, TypeError):
                    _logger.warning(f"无法转换数量值: {line.quantity}")
            
            # 然后尝试product_qty字段
            elif hasattr(line, 'product_qty') and line.product_qty:
                try:
                    quantity = int(float(line.product_qty))
                except (ValueError, TypeError):
                    _logger.warning(f"无法转换数量值: {line.product_qty}")
            
            # 确保最小数量为1
            quantity = max(1, quantity)
            _logger.info(f"产品行 {line.id} 数量: {quantity}")
            
            # 提取产品类型（Style）
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
            else:
                style = product_name
            
            # 获取客户名
            customer = line.invoice_id.partner_id.name if line.invoice_id and line.invoice_id.partner_id else ''
            # 如果客户名称太长，截取前10个字符加编号
            if customer and len(customer) > 10:
                customer_code = customer[:8] + str(line.invoice_id.id % 100000)
            else:
                customer_code = customer
            
            # 为每个数量创建一行
            for i in range(quantity):
                # 添加产品行数据
                product_lines.append({
                    'id': item_id,
                    'customer': customer_code,
                    'style': style,
                    'width': line.width or '',
                    'height': line.height or '',
                    'fh': '',
                    'frame': line.frame or '',
                    'glass': line.glass or '',
                    'argon': 'Yes' if line.argon else '',
                    'grid': line.grid or '',
                    'color': line.color or '',
                    'note': line.notes or '',
                })
                
                item_id += 1
        
        # 渲染模板 - 使用专为嵌入式设计的模板
        return request.render('rich_production.cutting_list_embed_template', {
            'production': production,
            'product_lines': product_lines,
            'report': report,
        })
    
    @http.route('/rich_production/create_cutting_list_report', type='json', auth="user")
    def create_cutting_list_report(self, production_id, **kw):
        """创建下料单报表记录并返回ID"""
        if not production_id:
            return False
            
        # 创建报表记录
        report = request.env['rich_production.cutting.list.report'].search(
            [('production_id', '=', production_id)], limit=1)
        
        if not report:
            report = request.env['rich_production.cutting.list.report'].create({
                'production_id': production_id
            })
            
        # 确保报表已生成
        if report.state != 'done':
            report.generate_report()
            
        return report.id
    
    @http.route('/rich_production/test_route', type='http', auth='public')
    def test_route(self, **kw):
        """测试路由，确保控制器正常工作"""
        return Response(
            "控制器正常工作！当前时间: " + str(datetime.now()),
            status=200,
            headers=[('Content-Type', 'text/plain')]
        )

    @http.route('/api/rich_production/window_calculation/list', type='json', auth='user')
    def list_window_calculations(self, **kwargs):
        """获取窗户计算结果列表"""
        try:
            data = request.jsonrequest
            production_id = data.get('production_id')
            
            domain = []
            if production_id:
                domain = [('production_id', '=', production_id)]
            
            results = request.env['window.calculation.result'].search_read(
                domain=domain,
                fields=['id', 'name', 'production_id']
            )
            
            return {
                'status': 'success',
                'results': results
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': str(e)
            }
    
    @http.route('/api/rich_production/window_calculation/get/<int:result_id>', type='json', auth='user')
    def get_window_calculation(self, result_id, **kwargs):
        """获取窗户计算结果详情"""
        try:
            result = request.env['window.calculation.result'].browse(result_id)
            if not result.exists():
                return {'status': 'error', 'message': 'Record not found'}
            
            # 获取关联的详细数据
            frame_data = request.env['window.frame.data'].search_read(
                domain=[('result_id', '=', result_id)],
                fields=['name', 'width', 'height', 'material', 'quantity', 'data_json']
            )
            
            sash_data = request.env['window.sash.data'].search_read(
                domain=[('result_id', '=', result_id)],
                fields=['name', 'width', 'height', 'material', 'quantity', 'data_json']
            )
            
            screen_data = request.env['window.screen.data'].search_read(
                domain=[('result_id', '=', result_id)],
                fields=['name', 'width', 'height', 'material', 'quantity', 'data_json']
            )
            
            parts_data = request.env['window.parts.data'].search_read(
                domain=[('result_id', '=', result_id)],
                fields=['name', 'specs', 'material', 'quantity', 'data_json']
            )
            
            glass_data = request.env['window.glass.data'].search_read(
                domain=[('result_id', '=', result_id)],
                fields=['name', 'width', 'height', 'thickness', 'type', 'quantity', 'data_json']
            )
            
            grid_data = request.env['window.grid.data'].search_read(
                domain=[('result_id', '=', result_id)],
                fields=['name', 'length', 'material', 'quantity', 'data_json']
            )
            
            return {
                'status': 'success',
                'result': {
                    'id': result.id,
                    'name': result.name,
                    'production_id': result.production_id.id if result.production_id else False,
                    'result_json': json.loads(result.result_json) if result.result_json else {},
                    'frame_data': frame_data,
                    'sash_data': sash_data,
                    'screen_data': screen_data,
                    'parts_data': parts_data,
                    'glass_data': glass_data,
                    'grid_data': grid_data
                }
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': str(e)
            }
    
    @http.route('/api/rich_production/window_calculation/delete/<int:result_id>', type='json', auth='user')
    def delete_window_calculation(self, result_id, **kwargs):
        """删除窗户计算结果"""
        try:
            result = request.env['window.calculation.result'].browse(result_id)
            if not result.exists():
                return {'status': 'error', 'message': 'Record not found'}
            
            result.unlink()
            
            return {
                'status': 'success',
                'message': 'Window calculation result deleted successfully'
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': str(e)
            } 