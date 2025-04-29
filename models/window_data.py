from odoo import models, fields, api
import json
import logging

_logger = logging.getLogger(__name__)

class WindowCalculationResult(models.Model):
    _name = 'window.calculation.result'
    _description = '窗户计算结果'
    
    name = fields.Char(string='名称', required=True)
    production_id = fields.Many2one('rich.production.production', string='生产订单')
    result_json = fields.Text(string='计算结果JSON')
    window_line_id = fields.Many2one('rich_production.line', string='窗户行')
    
    # 基本信息
    style = fields.Char(string='风格')
    frame_type = fields.Char(string='框架类型')
    width = fields.Float(string='宽度')
    height = fields.Float(string='高度')
    
    # 存储计算结果 (JSON格式)
    calculation_data = fields.Text(string='计算结果', help='JSON格式的计算结果数据')
    
    # 关联记录
    general_info_ids = fields.One2many('window.general.info', 'calculation_id', string='常规信息')
    frame_ids = fields.One2many('window.frame.data', 'calculation_id', string='框架数据')
    sash_ids = fields.One2many('window.sash.data', 'calculation_id', string='嵌扇数据')
    screen_ids = fields.One2many('window.screen.data', 'calculation_id', string='屏幕数据')
    parts_ids = fields.One2many('window.parts.data', 'calculation_id', string='零部件数据')
    glass_ids = fields.One2many('window.glass.data', 'calculation_id', string='玻璃数据')
    grid_ids = fields.One2many('window.grid.data', 'calculation_id', string='网格数据')
    label_ids = fields.One2many('window.label.data', 'calculation_id', string='标签数据')
    
    has_cached_data = fields.Boolean(string='有缓存数据', default=False)
    
    @api.model
    def create_from_json(self, name, result_data, production_id=None, window_line_id=None):
        """从JSON创建计算结果"""
        calculation_data = result_data.copy()
        
        # 创建计算结果记录
        result = self.create({
            'name': name,
            'production_id': production_id,
            'window_line_id': window_line_id,
            'calculation_data': json.dumps(calculation_data),
            'style': calculation_data.get('style', ''),
            'frame_type': calculation_data.get('frameType', ''),
            'width': calculation_data.get('width', 0.0),
            'height': calculation_data.get('height', 0.0),
        })
        
        # 解析并创建常规信息
        if 'generalInfo' in result_data:
            for info in result_data['generalInfo']:
                self.env['window.general.info'].create({
                    'calculation_id': result.id,
                    'result_id': result.id,
                    'key': info.get('key', ''),
                    'value': info.get('value', ''),
                    'section': info.get('section', '')
                })
        
        # 解析并创建框架数据
        if 'frame' in result_data:
            for frame in result_data['frame']:
                self.env['window.frame.data'].create({
                    'calculation_id': result.id,
                    'result_id': result.id,
                    'name': frame.get('name', ''),
                    'length': frame.get('length', 0),
                    'material': frame.get('material', ''),
                    'quantity': frame.get('quantity', 1),
                    'data_json': json.dumps(frame)
                })
        
        # 解析并创建嵌扇数据
        if 'sash' in result_data:
            for sash in result_data['sash']:
                self.env['window.sash.data'].create({
                    'calculation_id': result.id,
                    'result_id': result.id,
                    'name': sash.get('name', ''),
                    'length': sash.get('length', 0),
                    'material': sash.get('material', ''),
                    'quantity': sash.get('quantity', 1),
                    'data_json': json.dumps(sash)
                })
                
        # 解析并创建屏幕数据
        if 'screen' in result_data:
            for screen in result_data['screen']:
                self.env['window.screen.data'].create_from_data(screen, result.id, result.id)
        elif 'screenList' in result_data:
            for screen in result_data['screenList']:
                self.env['window.screen.data'].create_from_data(screen, result.id, result.id)
                
        # 解析并创建零部件数据
        if 'parts' in result_data:
            for part in result_data['parts']:
                self.env['window.parts.data'].create_from_data(part, result.id, result.id)
        elif 'partsList' in result_data:
            for part in result_data['partsList']:
                self.env['window.parts.data'].create_from_data(part, result.id, result.id)
                
        # 解析并创建玻璃数据
        if 'glass' in result_data:
            for glass in result_data['glass']:
                self.env['window.glass.data'].create({
                    'calculation_id': result.id,
                    'result_id': result.id,
                    'name': glass.get('name', ''),
                    'width': glass.get('width', 0),
                    'height': glass.get('height', 0),
                    'material': glass.get('material', ''),
                    'quantity': glass.get('quantity', 1),
                    'data_json': json.dumps(glass)
                })
                
        # 解析并创建网格数据
        if 'grid' in result_data:
            for grid in result_data['grid']:
                self.env['window.grid.data'].create_from_data(grid, result.id, result.id)
        elif 'gridList' in result_data:
            for grid in result_data['gridList']:
                self.env['window.grid.data'].create_from_data(grid, result.id, result.id)
                
        # 解析并创建标签数据
        if 'label' in result_data:
            for label in result_data['label']:
                self.env['window.label.data'].create_from_data(label, result.id, result.id)
        elif 'labelList' in result_data:
            for label in result_data['labelList']:
                self.env['window.label.data'].create_from_data(label, result.id, result.id)
        
        return result
    
    def _format_general_info(self, info):
        """格式化常规信息"""
        return {
            'id': info.item_id,
            'customer': info.customer,
            'style': info.style,
            'width': info.width,
            'height': info.height,
            'fh': info.fh,
            'frame': info.frame,
            'glass': info.glass,
            'argon': 'Yes' if info.argon else '',
            'grid': info.grid,
            'grid_size': info.grid_size,
            'batch': info.batch,
            'color': info.color,
            'note': info.note
        }

    @api.model
    def get_cached_result(self, window_id):
        """获取窗户的缓存计算结果"""
        result = self.search([
            ('window_line_id', '=', window_id),
            ('has_cached_data', '=', True)
        ], limit=1)
        
        if not result:
            return False
            
        # 组装返回数据
        res = {
            'id': result.id,
            'calculation_data': json.loads(result.calculation_data) if result.calculation_data else {},
            'general_info': [],
            'frame_data': [],
            'sash_data': [],
            'screen_data': [],
            'parts_data': [],
            'glass_data': [],
            'grid_data': [],
            'label_data': []
        }
        
        # 获取格式化的数据
        if result.general_info_ids:
            res['general_info'] = [self._format_general_info(i) for i in result.general_info_ids]
        if result.frame_ids:
            res['frame_data'] = [self._format_frame_data(f) for f in result.frame_ids]
        if result.sash_ids:
            res['sash_data'] = [self._format_sash_data(s) for s in result.sash_ids]
        if result.screen_ids:
            res['screen_data'] = [self._format_screen_data(s) for s in result.screen_ids]
        if result.parts_ids:
            res['parts_data'] = [self._format_parts_data(p) for p in result.parts_ids]
        if result.glass_ids:
            res['glass_data'] = [self._format_glass_data(g) for g in result.glass_ids]
        if result.grid_ids:
            res['grid_data'] = [self._format_grid_data(g) for g in result.grid_ids]
        if result.label_ids:
            res['label_data'] = [self._format_label_data(l) for l in result.label_ids]
            
        return res
    
    def _format_frame_data(self, frame):
        """格式化框架数据"""
        # 获取日志记录器用于记录格式化过程
        _logger.debug(f"格式化框架数据: ID={frame.id}, batch={frame.batch}, item_id={frame.item_id}")
        
        try:
            # 构建格式化结果
            result = {
                'batch': frame.batch,
                'style': frame.style,
                'color': frame.color,
                'id': frame.item_id,
                
                # 82-02B系列
                '82-02B--': frame.frame_82_02b,
                '82-02BPcs': frame.frame_82_02b_pcs,
                '82-02B|': frame.frame_82_02b_vertical,
                '82-02B|Pcs': frame.frame_82_02b_vertical_pcs,
                
                # 82-10系列
                '82-10--': frame.frame_82_10,
                '82-10Pcs': frame.frame_82_10_pcs,
                '82-10|': frame.frame_82_10_vertical,
                '82-10|Pcs': frame.frame_82_10_vertical_pcs,
                
                # 82-01系列
                '82-01--': frame.frame_82_01,
                '82-01Pcs': frame.frame_82_01_pcs,
                '82-01|': frame.frame_82_01_vertical,
                '82-01|Pcs': frame.frame_82_01_vertical_pcs
            }
            
            # 将所有零值转为0，确保前端显示一致性
            for key in result:
                if isinstance(result[key], (int, float)) and not result[key]:
                    result[key] = 0
            
            # 如果有兼容字段值，也添加到结果中
            if frame.material:
                result['material'] = frame.material
            if frame.position:
                result['position'] = frame.position
            if frame.length:
                result['length'] = frame.length
            if frame.qty:
                result['qty'] = frame.qty
            if frame.width:
                result['width'] = frame.width
            if frame.height:
                result['height'] = frame.height
            if frame.quantity and frame.quantity != 1:  # 只在不是默认值1时添加
                result['quantity'] = frame.quantity
                
            # 记录转换后的结果数据
            _logger.debug(f"格式化框架数据完成: batch={result['batch']}, id={result['id']}")
            _logger.debug(f"82-02B: 水平={result['82-02B--']}x{result['82-02BPcs']}, 垂直={result['82-02B|']}x{result['82-02B|Pcs']}")
            _logger.debug(f"82-10: 水平={result['82-10--']}x{result['82-10Pcs']}, 垂直={result['82-10|']}x{result['82-10|Pcs']}")
            _logger.debug(f"82-01: 水平={result['82-01--']}x{result['82-01Pcs']}, 垂直={result['82-01|']}x{result['82-01|Pcs']}")
            
            return result
        except Exception as e:
            _logger.error(f"格式化框架数据出错: {str(e)}, frame_id={frame.id}", exc_info=True)
            # 返回基本信息，避免整个流程中断
            return {
                'batch': frame.batch if frame.batch else '',
                'id': frame.item_id if frame.item_id else 0,
                'error': f"格式化失败: {str(e)}"
            }
        
    def _format_sash_data(self, sash):
        """格式化嵌扇数据"""
        return {
            'batch': sash.batch,
            'style': sash.style,
            'color': sash.color,
            'id': sash.item_id,
            
            # 82-03系列
            '82-03--': sash.sash_82_03,
            '82-03Pcs': sash.sash_82_03_pcs,
            '82-03|': sash.sash_82_03_vertical,
            '82-03|Pcs': sash.sash_82_03_vertical_pcs,
            
            # 82-05系列
            '82-05|': sash.sash_82_05_vertical,
            '82-05|Pcs': sash.sash_82_05_vertical_pcs,
            
            # 82-04系列
            '82-04--': sash.sash_82_04,
            '82-04Pcs': sash.sash_82_04_pcs,
            '82-04|': sash.sash_82_04_vertical,
            '82-04|Pcs': sash.sash_82_04_vertical_pcs
        }
        
    def _format_screen_data(self, screen):
        """格式化屏幕数据"""
        return {
            'batch': screen.batch,
            'lineId': screen.line_id,
            'style': screen.style,
            'screenw': screen.screenw,
            'screenwPcs': screen.screenw_pcs,
            'screenh': screen.screenh,
            'screenhPcs': screen.screenh_pcs,
            'color': screen.color,
            'id': screen.item_id,
            'customer': screen.customer
        }
        
    def _format_parts_data(self, part):
        """格式化零部件数据"""
        return {
            'batch': part.batch,
            'lineId': part.line_id,
            'style': part.style,
            'mullion': part.mullion,
            'centerAlu': part.center_alu,
            'handleAlu': part.handle_alu,
            'handlePcs': part.handle_pcs,
            'track': part.track,
            'coverH': part.cover_h,
            'coverV': part.cover_v,
            'largeMullion': part.large_mullion,
            'largeMullionPcs': part.large_mullion_pcs,
            'largeMullion2': part.large_mullion2,
            'largeMullion2Pcs': part.large_mullion2_pcs,
            'slop': part.slop,
            'color': part.color,
            'id': part.item_id
        }
        
    def _format_glass_data(self, glass):
        """格式化玻璃数据"""
        return {
            'line': glass.line,
            'qty': glass.qty,
            'glassType': glass.glass_type,
            'Tmprd': glass.tempered,
            'Thickness': glass.thickness,
            'width': glass.width,
            'height': glass.height
        }
        
    def _format_grid_data(self, grid):
        """格式化网格数据"""
        return {
            'batch': grid.batch,
            'lineId': grid.line_id,
            'style': grid.style,
            'color': grid.color,
            'id': grid.item_id,
            'note': grid.note,
            
            # 网格数据
            'gridW1': grid.grid_w1,
            'gridW1Pcs': grid.grid_w1_pcs,
            'gridW1Cut': grid.grid_w1_cut,
            'gridH1': grid.grid_h1,
            'gridH1Pcs': grid.grid_h1_pcs,
            'gridH1Cut': grid.grid_h1_cut,
            'gridW2': grid.grid_w2,
            'gridW2Pcs': grid.grid_w2_pcs,
            'gridW2Cut': grid.grid_w2_cut,
            'gridH2': grid.grid_h2,
            'gridH2Pcs': grid.grid_h2_pcs,
            'gridH2Cut': grid.grid_h2_cut,
            
            # 兼容旧格式
            'sashgridw': grid.sash_grid_w,
            'SashWq': grid.sash_w_qty,
            'holeW1': grid.hole_w1,
            'sashgridh': grid.sash_grid_h,
            'SashHq': grid.sash_h_qty,
            'holeH1': grid.hole_h1,
            'fixedgridw': grid.fixed_grid_w,
            'FixWq': grid.fixed_w_qty,
            'holeW2': grid.hole_w2,
            'fixedgridh': grid.fixed_grid_h,
            'FixHq': grid.fixed_h_qty,
            'holeH2': grid.hole_h2
        }
    
    def _format_label_data(self, label_data):
        """格式化标签数据"""
        return {
            'batch': label_data.get('batch', ''),
            'line_id': label_data.get('lineId', ''),
            'style': label_data.get('style', ''),
            'color': label_data.get('color', ''),
            'customer': label_data.get('customer', ''),
            'width': label_data.get('width', 0.0),
            'height': label_data.get('height', 0.0),
            'frame': label_data.get('frame', ''),
            'glass': label_data.get('glass', ''),
            'argon': label_data.get('argon', False),
            'grid': label_data.get('grid', ''),
            'grid_size': label_data.get('gridSize', ''),
            'po': label_data.get('po', '')
        }
    
    def _save_general_info(self, calc_id, calculation_data, sudo_inst=None):
        """保存常规信息"""
        if not calc_id or not calculation_data:
            return
        
        # 使用sudo获取管理员权限
        model_sudo = self.env['window.general.info'].sudo()
        
        # 先删除旧数据
        model_sudo.search([('calculation_id', '=', calc_id)]).unlink()
        
        # 处理formattedWindowInfo数据（前端新格式）
        if 'formattedWindowInfo' in calculation_data and calculation_data['formattedWindowInfo']:
            try:
                # 检查是否是列表类型
                formatted_windows = calculation_data['formattedWindowInfo']
                if not isinstance(formatted_windows, list):
                    formatted_windows = [formatted_windows]  # 如果不是列表，转换为单元素列表
                
                _logger.info(f"处理{len(formatted_windows)}个格式化窗口信息")
                
                # 遍历每个窗口信息
                for window_info in formatted_windows:
                    _logger.info(f"处理formattedWindowInfo数据: {window_info}")
                    
                    # 处理argon字段，可能是"Yes"字符串或者布尔值
                    argon_value = window_info.get('argon')
                    if isinstance(argon_value, str):
                        argon_bool = argon_value.lower() == 'yes'
                    else:
                        argon_bool = bool(argon_value)
                    
                    # 从窗口信息创建常规信息记录
                    general_info_data = {
                        'calculation_id': calc_id,
                        'result_id': calc_id,
                        'batch': self._safe_str(window_info.get('batch')),
                        'item_id': self._safe_int(window_info.get('id')),
                        'customer': self._safe_str(window_info.get('customer')),
                        'style': self._safe_str(window_info.get('style')),
                        'width': self._safe_float(window_info.get('width')),
                        'height': self._safe_float(window_info.get('height')),
                        'fh': self._safe_str(window_info.get('fh')),
                        'frame': self._safe_str(window_info.get('frame')),
                        'glass': self._safe_str(window_info.get('glass')),
                        'argon': argon_bool,
                        'grid': self._safe_str(window_info.get('grid')),
                        'grid_size': self._safe_str(window_info.get('grid_size')),
                        'color': self._safe_str(window_info.get('color')),
                        'note': self._safe_str(window_info.get('note')),
                    }
                    model_sudo.create(general_info_data)
                
                _logger.info(f"从formattedWindowInfo创建了常规信息记录，ID={calc_id}")
                # 不返回，继续处理其他格式数据
            except Exception as e:
                _logger.error(f"处理formattedWindowInfo数据时出错: {str(e)}")
                # 出错时尝试继续处理其他格式
        
        # 保存常规信息数据（如果windowInfo处理失败或不存在）
        general_info = calculation_data.get('general_info', [])
        if general_info and isinstance(general_info, list):
            for info in general_info:
                try:
                    model_sudo.create_from_data(info, calc_id)
                except Exception as e:
                    _logger.error(f"保存常规信息错误: {str(e)}, 数据: {info}")
                    # 继续处理下一条记录，不中断整个过程
    
    @api.model
    def save_calculation(self, window_id, calculation_data):
        """保存计算结果"""
        if not window_id:
            return {'error': '没有提供窗户ID'}
            
        try:
            # 记录原始数据大小，帮助调试
            data_size = len(json.dumps(calculation_data))
            _logger.info(f"保存窗户ID={window_id}的计算结果，数据大小: {data_size} 字节")
            
            # 使用sudo()提升权限
            self_sudo = self.sudo()
            
            # 尝试将window_id转换为整数并查找相应的窗户行，但如果找不到也继续处理
            production_id = False
            window_line = None
            width = 0
            height = 0
            style = ''
            
            try:
                window_line = self.env['rich_production.line'].sudo().browse(int(window_id))
                if window_line.exists():
                    _logger.info(f"找到窗户行: window_id={window_id}")
                    
                    # 如果窗户行存在，获取相关信息
                    if hasattr(window_line, 'production_id') and window_line.production_id:
                        production_id = window_line.production_id.id
                        
                    # 安全获取宽高和风格数据
                    if hasattr(window_line, 'width'):
                        try:
                            width = float(window_line.width) if window_line.width else 0
                        except (ValueError, TypeError):
                            width = 0
                    if hasattr(window_line, 'height'):
                        try:
                            height = float(window_line.height) if window_line.height else 0
                        except (ValueError, TypeError):
                            height = 0
                    if hasattr(window_line, 'style'):
                        style = window_line.style or ''
                else:
                    _logger.warning(f"找不到指定的窗户行，但会继续创建计算结果: window_id={window_id}")
            except Exception as e:
                _logger.warning(f"查找窗户行时出错，但会继续创建计算结果: {str(e)}, window_id={window_id}")
            
            # 创建一个数据副本，以避免修改原始数据
            save_data = {}
            if isinstance(calculation_data, dict):
                save_data = calculation_data.copy()
                
                # 从计算数据中获取尺寸和风格信息（如果窗户行不存在）
                if not window_line or not window_line.exists():
                    if 'width' in save_data:
                        width = self._safe_float(save_data.get('width'))
                    if 'height' in save_data:
                        height = self._safe_float(save_data.get('height'))
                    if 'style' in save_data:
                        style = self._safe_str(save_data.get('style'))
                
                # 处理格式化数据 - 如果存在则保存，否则忽略
                if 'frameData' in save_data:
                    _logger.info(f"窗户ID={window_id} 包含格式化的frame数据")
                
                if 'sashData' in save_data:
                    _logger.info(f"窗户ID={window_id} 包含格式化的sash数据")
                
                if 'screenData' in save_data:
                    _logger.info(f"窗户ID={window_id} 包含格式化的screen数据")
                
                if 'partsData' in save_data:
                    _logger.info(f"窗户ID={window_id} 包含格式化的parts数据")
                
                if 'glassData' in save_data:
                    _logger.info(f"窗户ID={window_id} 包含格式化的glass数据")
                
                if 'gridData' in save_data:
                    _logger.info(f"窗户ID={window_id} 包含格式化的grid数据")
            else:
                _logger.error(f"窗户ID={window_id} 计算数据不是字典类型: {type(calculation_data)}")
                return {'error': '计算数据格式不正确', 'window_id': window_id}
            
            # 转换为JSON保存
            calculation_json = json.dumps(save_data)
            
            # 创建或更新计算结果记录 - 使用sudo()提升权限
            calc_result = self_sudo.search([
                ('window_line_id', '=', window_id)
            ], limit=1)
            
            if calc_result:
                _logger.info(f"更新窗户ID={window_id}的现有计算结果记录")
                calc_result.sudo().write({
                    'calculation_data': calculation_json,
                    'has_cached_data': True
                })
            else:
                # 创建新记录
                _logger.info(f"为窗户ID={window_id}创建新的计算结果记录")
                calc_result = self_sudo.create({
                    'name': f'计算结果 {window_id}',
                    'window_line_id': window_id if window_line and window_line.exists() else False,
                    'production_id': production_id,
                    'style': style,
                    'frame_type': save_data.get('frameType', ''),
                    'width': width,
                    'height': height,
                    'calculation_data': calculation_json,
                    'has_cached_data': True
                })
            
            # 保存各类明细数据 - 传递sudo实例
            self._save_general_info(calc_result.id, save_data, sudo_inst=self_sudo)
            self._save_frame_data(calc_result.id, save_data, sudo_inst=self_sudo)
            self._save_sash_data(calc_result.id, save_data, sudo_inst=self_sudo)
            self._save_screen_data(calc_result.id, save_data, sudo_inst=self_sudo)
            self._save_parts_data(calc_result.id, save_data, sudo_inst=self_sudo)
            self._save_glass_data(calc_result.id, save_data, sudo_inst=self_sudo)
            self._save_grid_data(calc_result.id, save_data, sudo_inst=self_sudo)
            self._save_label_data(calc_result.id, save_data, sudo_inst=self_sudo)
            
            _logger.info(f"窗户ID={window_id}的计算结果保存成功")
            # 所有处理成功后才提交事务，不在函数内提交事务，由调用方决定
            return {'success': True, 'id': calc_result.id}
        except Exception as e:
            _logger.error(f"保存计算结果错误: {str(e)}, 窗户ID: {window_id}")
            return {'error': str(e), 'window_id': window_id}
        
    @api.model
    def _safe_float(self, value, default=0.0):
        """安全地将值转换为浮点数"""
        if value is None:
            return default
        try:
            # 处理字符串中可能包含的引号和特殊字符
            if isinstance(value, str):
                value = value.strip('"\'')
            return float(value)
        except (ValueError, TypeError):
            return default

    @api.model
    def _safe_int(self, value, default=0):
        """安全地将值转换为整数"""
        if value is None:
            return default
        try:
            # 先尝试转换为浮点数，然后转为整数
            return int(float(str(value).strip('"\'')) if value else default)
        except (ValueError, TypeError):
            return default

    @api.model
    def _safe_str(self, value, default=''):
        """安全地将值转换为字符串"""
        if value is None:
            return default
        try:
            return str(value)
        except Exception:
            return default

    def _save_frame_data(self, calc_id, calculation_data, sudo_inst=None):
        """保存框架数据"""
        if not calc_id or not calculation_data:
            return
        
        # 使用sudo获取管理员权限
        frame_model = self.env['window.frame.data'].sudo()
        
        # 先删除旧数据
        frame_model.search([('calculation_id', '=', calc_id)]).unlink()
        
        # 保存新数据 - 优先使用格式化后的frameData
        if 'formattedFrame' in calculation_data and calculation_data['formattedFrame']:
            try:
                _logger.info(f"使用格式化的frameData保存框架数据")
                
                # 检查是否是列表类型
                formatted_frames = calculation_data['formattedFrame']
                if not isinstance(formatted_frames, list):
                    formatted_frames = [formatted_frames]  # 如果不是列表，转换为单元素列表
                
                _logger.info(f"处理{len(formatted_frames)}个格式化框架数据项")
                
                # 遍历每个框架数据项
                for frame_data in formatted_frames:
                    vals = {
                        'calculation_id': calc_id,
                        'result_id': calc_id,
                        'batch': self._safe_str(frame_data.get('batch')),
                        'style': self._safe_str(frame_data.get('style')),
                        'color': self._safe_str(frame_data.get('color')),
                        'item_id': self._safe_int(frame_data.get('id')),
                        'frameType': self._safe_str(frame_data.get('frameType')),
                        
                        # 82-01系列
                        'frame_82_01': self._safe_float(frame_data.get('82-01--')),
                        'frame_82_01_pcs': self._safe_int(frame_data.get('82-01Pcs')),
                        'frame_82_01_vertical': self._safe_float(frame_data.get('82-01|')),
                        'frame_82_01_vertical_pcs': self._safe_int(frame_data.get('82-01|Pcs')),
                        
                        # 82-02B系列
                        'frame_82_02b': self._safe_float(frame_data.get('82-02B--')),
                        'frame_82_02b_pcs': self._safe_int(frame_data.get('82-02BPcs')),
                        'frame_82_02b_vertical': self._safe_float(frame_data.get('82-02B|')),
                        'frame_82_02b_vertical_pcs': self._safe_int(frame_data.get('82-02B|Pcs')),
                        
                        # 82-10系列
                        'frame_82_10': self._safe_float(frame_data.get('82-10--')),
                        'frame_82_10_pcs': self._safe_int(frame_data.get('82-10Pcs')),
                        'frame_82_10_vertical': self._safe_float(frame_data.get('82-10|')),
                        'frame_82_10_vertical_pcs': self._safe_int(frame_data.get('82-10|Pcs')),
                        
                        # 额外数据
                        'data_json': json.dumps(frame_data)
                    }
                    frame_model.create(vals)
                
                # 注意这里不返回，继续处理旧格式数据
                _logger.info(f"格式化框架数据处理完成")
            except Exception as e:
                _logger.error(f"处理格式化frameData时出错: {str(e)}")
                # 发生错误时回退到传统处理方式
        
        # 如果没有格式化数据或处理失败，尝试处理传统格式的frame数据
        frame_data = calculation_data.get('frame', [])
        if frame_data and isinstance(frame_data, list):
            for frame in frame_data:
                try:
                    frame_model.create_from_data(frame, calc_id)
                except Exception as e:
                    _logger.error(f"保存框架数据错误: {str(e)}, 数据: {frame}")
    def _save_sash_data(self, calc_id, calculation_data, sudo_inst=None):
        """保存嵌扇数据"""
        if not calc_id or not calculation_data:
            return
        
        # 使用sudo获取管理员权限
        sash_model = self.env['window.sash.data'].sudo()
        
        # 先删除旧数据
        sash_model.search([('calculation_id', '=', calc_id)]).unlink()
        
        # 保存新数据 - 优先使用格式化后的sashData
        if 'formattedSash' in calculation_data and calculation_data['formattedSash']:
            try:
                _logger.info(f"使用格式化的sashData保存嵌扇数据")
                
                # 检查是否是列表类型
                formatted_sashes = calculation_data['formattedSash']
                if not isinstance(formatted_sashes, list):
                    formatted_sashes = [formatted_sashes]  # 如果不是列表，转换为单元素列表
                
                _logger.info(f"处理{len(formatted_sashes)}个格式化嵌扇数据项")
                
                # 遍历处理每个嵌扇数据
                for sash_data in formatted_sashes:
                    vals = {
                        'calculation_id': calc_id,
                        'result_id': calc_id,
                        'batch': self._safe_str(sash_data.get('batch')),
                        'style': self._safe_str(sash_data.get('style')),
                        'color': self._safe_str(sash_data.get('color')),
                        'item_id': self._safe_int(sash_data.get('id')),
                        
                        # 82-03系列
                        'sash_82_03': self._safe_float(sash_data.get('82-03--')),
                        'sash_82_03_pcs': self._safe_int(sash_data.get('82-03Pcs')),
                        'sash_82_03_vertical': self._safe_float(sash_data.get('82-03|')),
                        'sash_82_03_vertical_pcs': self._safe_int(sash_data.get('82-03|Pcs')),
                        
                        # 82-05系列
                        'sash_82_05_vertical': self._safe_float(sash_data.get('82-05|')),
                        'sash_82_05_vertical_pcs': self._safe_int(sash_data.get('82-05|Pcs')),
                        
                        # 82-04系列
                        'sash_82_04': self._safe_float(sash_data.get('82-04--')),
                        'sash_82_04_pcs': self._safe_int(sash_data.get('82-04Pcs')),
                        'sash_82_04_vertical': self._safe_float(sash_data.get('82-04|')),
                        'sash_82_04_vertical_pcs': self._safe_int(sash_data.get('82-04|Pcs')),
                        
                        # 额外数据
                        'data_json': json.dumps(sash_data)
                    }
                    sash_model.create(vals)
                
                _logger.info(f"格式化嵌扇数据处理完成")
                # 不返回，继续尝试处理旧格式数据
            except Exception as e:
                _logger.error(f"处理格式化sashData时出错: {str(e)}")
                # 发生错误时回退到传统处理方式
        
        # 回退：处理标准sash数组
        sashes = []
        if 'sash' in calculation_data and isinstance(calculation_data['sash'], list):
            sashes = calculation_data['sash']
        
        if sashes:
            for sash in sashes:
                try:
                    create_result = sash_model.create_from_data(sash, calc_id, calc_id)
                    if not create_result:
                        _logger.warning(f"创建嵌扇数据无结果: sash_id={sash.get('id')}")
                except Exception as e:
                    _logger.error(f"保存嵌扇数据错误: {str(e)}, 数据: {sash}")
                    # 继续处理下一条记录，不中断整个过程
    
    def _save_screen_data(self, calc_id, calculation_data, sudo_inst=None):
        """保存屏幕数据"""
        if not calc_id or not calculation_data:
            return
            
        # 使用sudo获取管理员权限
        screen_model = self.env['window.screen.data'].sudo()
        
        # 先删除旧数据
        screen_model.search([('calculation_id', '=', calc_id)]).unlink()
        
        # 保存新数据 - 优先使用格式化后的screenData
        if 'formattedScreen' in calculation_data and calculation_data['formattedScreen']:
            try:
                _logger.info(f"使用格式化的screenData保存屏幕数据")
                
                # 检查是否是列表类型
                formatted_screens = calculation_data['formattedScreen']
                if not isinstance(formatted_screens, list):
                    formatted_screens = [formatted_screens]  # 如果不是列表，转换为单元素列表
                
                _logger.info(f"处理{len(formatted_screens)}个格式化屏幕数据项")
                
                # 遍历处理每个屏幕数据
                for screen_data in formatted_screens:
                    vals = {
                        'calculation_id': calc_id,
                        'result_id': calc_id,
                        'batch': self._safe_str(screen_data.get('batch')),
                        'line_id': self._safe_int(screen_data.get('lineId')),
                        'style': self._safe_str(screen_data.get('style')),
                        'color': self._safe_str(screen_data.get('color')),
                        'item_id': self._safe_int(screen_data.get('id')),
                        'customer': self._safe_str(screen_data.get('customer')),
                        
                        # 屏幕数据
                        'screenw': self._safe_float(screen_data.get('screenW')),
                        'screenw_pcs': self._safe_int(screen_data.get('screenWPcs')),
                        'screenh': self._safe_float(screen_data.get('screenH')),
                        'screenh_pcs': self._safe_int(screen_data.get('screenHPcs')),
                        
                        # 额外数据
                        'data_json': json.dumps(screen_data)
                    }
                    screen_model.create(vals)
                
                _logger.info(f"格式化屏幕数据处理完成")
                # 不返回，继续尝试处理旧格式数据
            except Exception as e:
                _logger.error(f"处理格式化screenData时出错: {str(e)}")
                # 发生错误时回退到传统处理方式
        
        # 处理标准screen数组
        screens = []
        if 'screen' in calculation_data and isinstance(calculation_data['screen'], list):
            screens = calculation_data['screen']
        
        if screens:
            for screen in screens:
                try:
                    screen_model.create_from_data(screen, calc_id, calc_id)
                except Exception as e:
                    _logger.error(f"保存屏幕数据错误: {str(e)}, 数据: {screen}")
                    # 继续处理下一条记录，不中断整个过程
                    
    def _save_parts_data(self, calc_id, calculation_data, sudo_inst=None):
        """保存零部件数据"""
        if not calc_id or not calculation_data:
            return
            
        # 使用sudo获取管理员权限
        parts_model = self.env['window.parts.data'].sudo()
        
        # 先删除旧数据
        parts_model.search([('calculation_id', '=', calc_id)]).unlink()
        
        # 保存新数据 - 优先使用格式化后的partsData
        if 'formattedParts' in calculation_data and calculation_data['formattedParts']:
            try:
                _logger.info(f"使用格式化的partsData保存零部件数据")
                
                # 检查是否是列表类型
                formatted_parts = calculation_data['formattedParts']
                if not isinstance(formatted_parts, list):
                    formatted_parts = [formatted_parts]  # 如果不是列表，转换为单元素列表
                
                _logger.info(f"处理{len(formatted_parts)}个格式化零部件数据项")
                
                # 遍历处理每个零部件数据
                for parts_data in formatted_parts:
                    vals = {
                        'calculation_id': calc_id,
                        'result_id': calc_id,
                        'batch': self._safe_str(parts_data.get('batch')),
                        'line_id': self._safe_int(parts_data.get('lineId')),
                        'style': self._safe_str(parts_data.get('style')),
                        'color': self._safe_str(parts_data.get('color')),
                        'item_id': self._safe_int(parts_data.get('id')),
                        
                        # 部件特有数据
                        'mullion': self._safe_str(parts_data.get('mullion')),
                        'center_alu': self._safe_str(parts_data.get('centerAlu')),
                        'handle_alu': self._safe_str(parts_data.get('handleAlu')),
                        'handle_pcs': self._safe_int(parts_data.get('handlePcs')),
                        'track': self._safe_str(parts_data.get('track')),
                        'cover_h': self._safe_str(parts_data.get('coverH')),
                        'cover_v': self._safe_str(parts_data.get('coverV')),
                        'large_mullion': self._safe_str(parts_data.get('largeMullion')),
                        'large_mullion_pcs': self._safe_int(parts_data.get('largeMullionPcs')),
                        'large_mullion2': self._safe_str(parts_data.get('largeMullion2')),
                        'large_mullion2_pcs': self._safe_int(parts_data.get('largeMullion2Pcs')),
                        'slop': self._safe_str(parts_data.get('slop')),
                        
                        # 额外数据
                        'data_json': json.dumps(parts_data)
                    }
                    parts_model.create(vals)
                
                _logger.info(f"格式化零部件数据处理完成")
                # 不返回，继续尝试处理旧格式数据
            except Exception as e:
                _logger.error(f"处理格式化partsData时出错: {str(e)}")
                # 发生错误时回退到传统处理方式
        
        # 处理标准parts数组
        parts = []
        if 'parts' in calculation_data and isinstance(calculation_data['parts'], list):
            parts = calculation_data['parts']
        
        if parts:
            for part in parts:
                try:
                    parts_model.create_from_data(part, calc_id, calc_id)
                except Exception as e:
                    _logger.error(f"保存零部件数据错误: {str(e)}, 数据: {part}")
                    # 继续处理下一条记录，不中断整个过程
                    
    def _save_glass_data(self, calc_id, calculation_data, sudo_inst=None):
        """保存玻璃数据"""
        if not calc_id or not calculation_data:
            return
            
        # 使用sudo获取管理员权限
        glass_model = self.env['window.glass.data'].sudo()
        
        # 先删除旧数据
        glass_model.search([('calculation_id', '=', calc_id)]).unlink()
        
        # 保存新数据 - 优先使用格式化后的glassData
        if 'formattedGlass' in calculation_data and calculation_data['formattedGlass']:
            try:
                # formatted_glass总是一个列表
                formatted_glass = calculation_data['formattedGlass']
                if not isinstance(formatted_glass, list):
                    formatted_glass = [formatted_glass]
                    
                _logger.info(f"使用格式化的glassData保存玻璃数据，数量: {len(formatted_glass)}")
                
                # 遍历处理每条玻璃记录
                for glass_data in formatted_glass:
                    vals = {
                        'calculation_id': calc_id,
                        'result_id': calc_id,
                        'line': self._safe_int(glass_data.get('line')),
                        'qty': self._safe_int(glass_data.get('qty')),
                        'quantity': self._safe_int(glass_data.get('quantity', 1)),
                        'glass_type': self._safe_str(glass_data.get('glassType')),
                        'tempered': self._safe_str(glass_data.get('tempered')),
                        'thickness': self._safe_str(glass_data.get('thickness')),
                        'width': self._safe_float(glass_data.get('width')),
                        'height': self._safe_float(glass_data.get('height')),
                        'name': self._safe_str(glass_data.get('name')),
                        'type': self._safe_str(glass_data.get('type')),
                        'data_json': json.dumps(glass_data)
                    }
                    glass_model.create(vals)
                
                _logger.info(f"格式化玻璃数据处理完成")
                # 不返回，继续尝试处理旧格式数据
            except Exception as e:
                _logger.error(f"处理格式化glassData时出错: {str(e)}")
                # 发生错误时回退到传统处理方式
            
        # 处理标准glass数组
        glasses = []
        if 'glass' in calculation_data and isinstance(calculation_data['glass'], list):
            glasses = calculation_data['glass']
            
        # 处理旧格式glass数据
        if glasses:
            for glass in glasses:
                try:
                    glass_model.create({
                        'calculation_id': calc_id,
                        'result_id': calc_id,
                        'line': self._safe_int(glass.get('line')),
                        'qty': self._safe_int(glass.get('qty')),
                        'glass_type': self._safe_str(glass.get('glass_type')),
                        'tempered': self._safe_str(glass.get('tempered')),
                        'thickness': self._safe_str(glass.get('thickness')),
                        'width': self._safe_float(glass.get('width')),
                        'height': self._safe_float(glass.get('height')),
                        'type': self._safe_str(glass.get('type')),
                        'data_json': json.dumps(glass)
                    })
                except Exception as e:
                    _logger.error(f"保存玻璃数据错误: {str(e)}, 数据: {glass}")
                    # 继续处理下一条记录，不中断整个过程
                    
    def _save_grid_data(self, calc_id, calculation_data, sudo_inst=None):
        """保存网格数据"""
        if not calc_id or not calculation_data:
            return
            
        # 使用sudo获取管理员权限
        grid_model = self.env['window.grid.data'].sudo()
        
        # 先删除旧数据
        grid_model.search([('calculation_id', '=', calc_id)]).unlink()
        
        # 保存新数据 - 优先使用格式化后的gridData
        if 'formattedGrid' in calculation_data and calculation_data['formattedGrid']:
            try:
                _logger.info(f"使用格式化的gridData保存网格数据")
                
                # 检查是否是列表类型
                formatted_grids = calculation_data['formattedGrid']
                if not isinstance(formatted_grids, list):
                    formatted_grids = [formatted_grids]  # 如果不是列表，转换为单元素列表
                
                _logger.info(f"处理{len(formatted_grids)}个格式化网格数据项")
                
                # 遍历处理每个网格数据
                for grid_data in formatted_grids:
                    vals = {
                        'calculation_id': calc_id,
                        'result_id': calc_id,
                        'batch': self._safe_str(grid_data.get('batch')),
                        'line_id': self._safe_int(grid_data.get('lineId')),
                        'style': self._safe_str(grid_data.get('style')),
                        'color': self._safe_str(grid_data.get('color')),
                        'item_id': self._safe_int(grid_data.get('id')),
                        'note': self._safe_str(grid_data.get('note')),
                        
                        # W1区域
                        'grid_w1': self._safe_float(grid_data.get('gridW1')),
                        'grid_w1_pcs': self._safe_int(grid_data.get('gridW1Pcs')),
                        'grid_w1_cut': grid_data.get('gridW1Cut', False),
                        
                        # H1区域
                        'grid_h1': self._safe_float(grid_data.get('gridH1')),
                        'grid_h1_pcs': self._safe_int(grid_data.get('gridH1Pcs')),
                        'grid_h1_cut': grid_data.get('gridH1Cut', False),
                        
                        # W2区域
                        'grid_w2': self._safe_float(grid_data.get('gridW2')),
                        'grid_w2_pcs': self._safe_int(grid_data.get('gridW2Pcs')),
                        'grid_w2_cut': grid_data.get('gridW2Cut', False),
                        
                        # H2区域
                        'grid_h2': self._safe_float(grid_data.get('gridH2')),
                        'grid_h2_pcs': self._safe_int(grid_data.get('gridH2Pcs')),
                        'grid_h2_cut': grid_data.get('gridH2Cut', False),
                        
                        # 用于计算的字段
                        'sash_grid_w': self._safe_float(grid_data.get('sashGridW')),
                        'sash_w_qty': self._safe_int(grid_data.get('sashWQty')),
                        'hole_w1': self._safe_float(grid_data.get('holeW1')),
                        'sash_grid_h': self._safe_float(grid_data.get('sashGridH')),
                        'sash_h_qty': self._safe_int(grid_data.get('sashHQty')),
                        'hole_h1': self._safe_float(grid_data.get('holeH1')),
                        'fixed_grid_w': self._safe_float(grid_data.get('fixedGridW')),
                        'fixed_w_qty': self._safe_int(grid_data.get('fixedWQty')),
                        'hole_w2': self._safe_float(grid_data.get('holeW2')),
                        'fixed_grid_h': self._safe_float(grid_data.get('fixedGridH')),
                        'fixed_h_qty': self._safe_int(grid_data.get('fixedHQty')),
                        'hole_h2': self._safe_float(grid_data.get('holeH2')),
                        
                        # 额外数据
                        'data_json': json.dumps(grid_data)
                    }
                    grid_model.create(vals)
                
                _logger.info(f"格式化网格数据处理完成")
                # 不返回，继续尝试处理旧格式数据
            except Exception as e:
                _logger.error(f"处理格式化gridData时出错: {str(e)}")
                # 发生错误时回退到传统处理方式
        
        # 处理标准grid数组
        grids = []
        if 'grid' in calculation_data and isinstance(calculation_data['grid'], list):
            grids = calculation_data['grid']
        
        if grids:
            for grid in grids:
                try:
                    grid_model.create_from_data(grid, calc_id, calc_id)
                except Exception as e:
                    _logger.error(f"保存网格数据错误: {str(e)}, 数据: {grid}")
                    # 继续处理下一条记录，不中断整个过程
    
    def _save_label_data(self, calc_id, calculation_data, sudo_inst=None):
        """保存标签数据"""
        if not calculation_data or not calc_id:
            return
            
        # 使用sudo获取管理员权限
        label_model = self.env['window.label.data'].sudo()
            
        # 删除现有标签数据
        label_model.search([('calculation_id', '=', calc_id)]).unlink()
        
        # 创建新的标签数据
        try:
            if 'label' in calculation_data:
                label_data = calculation_data['label']
                formatted_data = self._format_label_data(label_data)
                formatted_data.update({
                    'calculation_id': calc_id,
                    'result_id': calc_id
                })
                label_model.create(formatted_data)
            elif 'labelList' in calculation_data and isinstance(calculation_data['labelList'], list):
                for label in calculation_data['labelList']:
                    formatted_data = self._format_label_data(label)
                    formatted_data.update({
                        'calculation_id': calc_id,
                        'result_id': calc_id
                    })
                    label_model.create(formatted_data)
        except Exception as e:
            _logger.error(f"保存标签数据错误: {str(e)}, calc_id: {calc_id}")
            # 继续处理，不影响其他数据保存
    
    def clear_calculation_cache(self, window_ids=None):
        """清除计算缓存"""
        domain = [('has_cached_data', '=', True)]
        if window_ids:
            domain.append(('window_line_id', 'in', window_ids))
        records = self.search(domain)
        return records.write({'has_cached_data': False})

    def get_calculation_result(self, calc_id):
        """获取计算结果"""
        result = self.browse(calc_id)
        if not result:
            return {'error': '找不到计算结果'}
            
        # 格式化输出结果
        formatted_data = {
            'name': result.name,
            'generalInfo': [self._format_general_info(info) for info in result.general_info_ids],
            'frame': [self._format_frame_data(frame) for frame in result.frame_ids],
            'sash': [self._format_sash_data(sash) for sash in result.sash_ids],
            'screen': [self._format_screen_data(screen) for screen in result.screen_ids],
            'parts': [self._format_parts_data(part) for part in result.parts_ids],
            'glass': [self._format_glass_data(glass) for glass in result.glass_ids],
            'grid': [self._format_grid_data(grid) for grid in result.grid_ids],
            'label': [self._format_label_data(label) for label in result.label_ids]
        }
        
        # 添加窗户行的基本信息（从general_info中获取）
        if result.general_info_ids:
            general_info = result.general_info_ids[0]  # 通常只有一条记录
            formatted_data.update({
                'customer': general_info.customer,
                'style': general_info.style or result.style,
                'width': general_info.width or result.width,
                'height': general_info.height or result.height,
                'fh': general_info.fh,
                'frame': general_info.frame,
                'glass': general_info.glass,
                'argon': general_info.argon,
                'grid': general_info.grid,
                'color': general_info.color,
                'note': general_info.note,
                'item_id': general_info.item_id,
            })
        
        return formatted_data

    def save_calculation_result(self, calc_id, calculation_data):
        """保存计算结果"""
        calc_result = self.browse(calc_id)
        if not calc_result:
            return {'error': '找不到计算结果记录'}
            
        # 更新计算结果记录
        calc_result.write({
            'calculation_data': json.dumps(calculation_data),
            'style': calculation_data.get('style', ''),
            'frame_type': calculation_data.get('frameType', ''),
            'width': calculation_data.get('width', 0.0),
            'height': calculation_data.get('height', 0.0),
            'has_cached_data': True
        })
        
        # 保存各部分数据
        self._save_general_info(calc_result.id, calculation_data)
        self._save_frame_data(calc_result.id, calculation_data)
        self._save_sash_data(calc_result.id, calculation_data)
        self._save_screen_data(calc_result.id, calculation_data)
        self._save_parts_data(calc_result.id, calculation_data)
        self._save_glass_data(calc_result.id, calculation_data)
        self._save_grid_data(calc_result.id, calculation_data)
        self._save_label_data(calc_result.id, calculation_data)
        
        return {'success': True}

    # 标签相关方法
    def _process_label_data(self):
        """处理标签数据"""
        if not self.calculation_data:
            return False
            
        try:
            calculation_data = json.loads(self.calculation_data)
        except:
            return False
            
        # 处理标签数据
        label_data_obj = self.env['window.label.data']
        
        # 删除现有标签数据
        label_data_obj.search([('calculation_id', '=', self.id)]).unlink()
        
        # 处理单个标签数据
        if 'label' in calculation_data:
            label_data_obj.create_from_data(calculation_data['label'], self.id, self.id)
        
        # 处理标签列表数据
        if 'labelList' in calculation_data and isinstance(calculation_data['labelList'], list):
            for label in calculation_data['labelList']:
                label_data_obj.create_from_data(label, self.id, self.id)
                
        return True

    def process_calculation_data(self):
        """处理计算数据，解析并保存到相应的模型中"""
        self.ensure_one()
        
        # 处理零部件数据
        self._process_parts_data()
        
        # 处理屏幕数据
        self._process_screen_data()
        
        # 处理网格数据
        self._process_grid_data()
        
        # 处理标签数据
        self._process_label_data()
        
        # 处理完成后的额外操作
        self.processed = True
        self.processed_date = fields.Datetime.now()
        
        return {'success': True}

    @api.model
    def save_multiple_calculations(self, windows_data):
        """
        保存多个窗户计算结果
        :param windows_data: 包含窗户ID和计算数据的字典列表 [{'window_id': id, 'calculation_data': data}, ...]
        :return: 每个窗户的保存结果 {window_id: result, ...}
        """
        _logger.info(f"开始批量保存窗户计算结果，窗户数量: {len(windows_data)}")
        result = {}
        
        try:
            # 使用一个事务处理所有窗户
            with self.env.cr.savepoint():
                for window_item in windows_data:
                    window_id = window_item.get('window_id')
                    calculation_data = window_item.get('calculation_data')
                    
                    if not window_id or not calculation_data:
                        _logger.warning(f"跳过无效的窗户数据项: {window_item}")
                        result[str(window_id) if window_id else 'unknown'] = {'error': '窗户ID或计算数据缺失'}
                        continue
                    
                    _logger.info(f"处理窗户ID: {window_id}")
                    save_result = self.save_calculation(window_id, calculation_data)
                    result[str(window_id)] = save_result
                    
                    if 'error' in save_result:
                        _logger.warning(f"窗户ID={window_id} 计算结果保存失败: {save_result}")
                    else:
                        _logger.info(f"窗户ID={window_id} 计算结果保存成功")
                
                _logger.info(f"所有窗户计算结果处理完成，提交事务")
            
            # 记录最终结果
            success_count = sum(1 for r in result.values() if r.get('success', False))
            error_count = len(result) - success_count
            _logger.info(f"批量保存完成: 成功 {success_count}，失败 {error_count}")
            
            return result
        except Exception as e:
            _logger.error(f"批量保存窗户计算结果错误: {str(e)}")
            return {'error': f"批量保存失败: {str(e)}"}

    @api.model
    def get_batch_calculation_results(self, batch_number):
        """获取指定批次的所有计算结果
        
        Args:
            batch_number: 批次号
            
        Returns:
            list: 计算结果列表，每个条目包含窗户基本信息和计算数据
        """
        if not batch_number:
            return []
            
        # 查找与指定批次相关的所有生产订单
        productions = self.env['rich.production.production'].search([
            ('batch_number', '=', batch_number)
        ])
        
        if not productions:
            return []
            
        # 获取所有相关的计算结果
        results = self.search([
            ('production_id', 'in', productions.ids),
            ('has_cached_data', '=', True)
        ])
        
        # 格式化所有结果
        formatted_results = []
        for result in results:
            try:
                # 获取详细计算结果
                result_data = result.get_calculation_result(result.id)
                if result_data and not isinstance(result_data, dict) or 'error' not in result_data:
                    formatted_results.append(result_data)
            except Exception as e:
                _logger.error(f"获取计算结果错误: {str(e)}, 计算结果ID: {result.id}")
        
        return formatted_results

class WindowFrameData(models.Model):
    _name = 'window.frame.data'
    _description = '窗户框架数据'
    _rec_name = 'batch'  # 使用batch作为记录名称
    
    calculation_id = fields.Many2one('window.calculation.result', string='计算结果', ondelete='cascade')
    result_id = fields.Many2one('window.calculation.result', string='计算结果', ondelete='cascade')
    
    # 基本信息
    batch = fields.Char(string='批次')
    style = fields.Char(string='风格')
    color = fields.Char(string='颜色')
    item_id = fields.Integer(string='ID')
    frameType = fields.Char(string='框架类型')  # 添加框架类型字段
    
    # 82-02B系列
    frame_82_02b = fields.Float(string='82-02B--', help='82-02B系列水平框架')
    frame_82_02b_pcs = fields.Integer(string='82-02BPcs', help='82-02B系列水平框架数量')
    frame_82_02b_vertical = fields.Float(string='82-02B|', help='82-02B系列垂直框架')
    frame_82_02b_vertical_pcs = fields.Integer(string='82-02B|Pcs', help='82-02B系列垂直框架数量')
    
    # 82-10系列
    frame_82_10 = fields.Float(string='82-10--', help='82-10系列水平框架')
    frame_82_10_pcs = fields.Integer(string='82-10Pcs', help='82-10系列水平框架数量')
    frame_82_10_vertical = fields.Float(string='82-10|', help='82-10系列垂直框架')
    frame_82_10_vertical_pcs = fields.Integer(string='82-10|Pcs', help='82-10系列垂直框架数量')
    
    # 82-01系列
    frame_82_01 = fields.Float(string='82-01--', help='82-01系列水平框架')
    frame_82_01_pcs = fields.Integer(string='82-01Pcs', help='82-01系列水平框架数量')
    frame_82_01_vertical = fields.Float(string='82-01|', help='82-01系列垂直框架')
    frame_82_01_vertical_pcs = fields.Integer(string='82-01|Pcs', help='82-01系列垂直框架数量')
 
    
    # 兼容旧字段
    material = fields.Char(string='材料')
    position = fields.Char(string='位置')
    length = fields.Float(string='长度')
    qty = fields.Integer(string='数量')
    name = fields.Char(string='名称')
    width = fields.Float(string='宽度')
    height = fields.Float(string='高度')
    quantity = fields.Integer(string='数量', default=1)
    data_json = fields.Text(string='原始数据')
    
    def _get_frame_values(self):
        """获取框架值的汇总信息"""
        self.ensure_one()
        values = []
        
        # 添加82-02B系列
        if self.frame_82_02b > 0:
            values.append(f"82-02B--: {self.frame_82_02b:.2f}x{self.frame_82_02b_pcs}")
        if self.frame_82_02b_vertical > 0:
            values.append(f"82-02B|: {self.frame_82_02b_vertical:.2f}x{self.frame_82_02b_vertical_pcs}")
            
        # 添加82-10系列
        if self.frame_82_10 > 0:
            values.append(f"82-10--: {self.frame_82_10:.2f}x{self.frame_82_10_pcs}")
        if self.frame_82_10_vertical > 0:
            values.append(f"82-10|: {self.frame_82_10_vertical:.2f}x{self.frame_82_10_vertical_pcs}")
            
        # 添加82-01系列
        if self.frame_82_01 > 0:
            values.append(f"82-01--: {self.frame_82_01:.2f}x{self.frame_82_01_pcs}")
        if self.frame_82_01_vertical > 0:
            values.append(f"82-01|: {self.frame_82_01_vertical:.2f}x{self.frame_82_01_vertical_pcs}")
            
        return ", ".join(values) if values else "无框架数据"
        
    @api.model
    def create_from_data(self, data, calculation_id=None, result_id=None):
        """从字典数据创建记录"""
        if not data:
            return False
            
        try:
            # 创建基本值
            vals = {
                'calculation_id': calculation_id,
                'result_id': result_id,
                'batch': self._safe_str(data.get('batch')),
                'style': self._safe_str(data.get('style')),
                'color': self._safe_str(data.get('color')),
                'item_id': self._safe_int(data.get('id')),
                'frameType': self._safe_str(data.get('frameType')),
                'data_json': json.dumps(data)
            }
            
            # 处理不同的数据格式
            if 'material' in data and 'position' in data:
                # 处理传统格式数据
                material = self._safe_str(data.get('material'))
                position = self._safe_str(data.get('position'))
                length = self._safe_float(data.get('length'))
                qty = self._safe_int(data.get('qty'))
                
                # 设置兼容字段
                vals.update({
                    'material': material,
                    'position': position,
                    'length': length,
                    'qty': qty
                })
                
                # 映射到结构化字段
                if material == '82-02B' or material == '82-02':
                    if position == '--' or position == 'horizontal':
                        vals['frame_82_02b'] = length
                        vals['frame_82_02b_pcs'] = qty
                    elif position == '|' or position == 'vertical':
                        vals['frame_82_02b_vertical'] = length
                        vals['frame_82_02b_vertical_pcs'] = qty
                elif material == '82-10':
                    if position == '--' or position == 'horizontal':
                        vals['frame_82_10'] = length
                        vals['frame_82_10_pcs'] = qty
                    elif position == '|' or position == 'vertical':
                        vals['frame_82_10_vertical'] = length
                        vals['frame_82_10_vertical_pcs'] = qty
                elif material == '82-01':
                    if position == '--' or position == 'horizontal':
                        vals['frame_82_01'] = length
                        vals['frame_82_01_pcs'] = qty
                    elif position == '|' or position == 'vertical':
                        vals['frame_82_01_vertical'] = length
                        vals['frame_82_01_vertical_pcs'] = qty
            else:
                # 处理格式化数据 (更直接的格式)
                vals.update({
                    # 82-02B系列
                    'frame_82_02b': self._safe_float(data.get('82-02B--')),
                    'frame_82_02b_pcs': self._safe_int(data.get('82-02BPcs')),
                    'frame_82_02b_vertical': self._safe_float(data.get('82-02B|')),
                    'frame_82_02b_vertical_pcs': self._safe_int(data.get('82-02B|Pcs')),
                    
                    # 82-10系列
                    'frame_82_10': self._safe_float(data.get('82-10--')),
                    'frame_82_10_pcs': self._safe_int(data.get('82-10Pcs')),
                    'frame_82_10_vertical': self._safe_float(data.get('82-10|')),
                    'frame_82_10_vertical_pcs': self._safe_int(data.get('82-10|Pcs')),
                    
                    # 82-01系列
                    'frame_82_01': self._safe_float(data.get('82-01--')),
                    'frame_82_01_pcs': self._safe_int(data.get('82-01Pcs')),
                    'frame_82_01_vertical': self._safe_float(data.get('82-01|')),
                    'frame_82_01_vertical_pcs': self._safe_int(data.get('82-01|Pcs')),
                })
            
            return self.create(vals)
        except Exception as e:
            _logger.error(f"创建框架数据错误: {str(e)}", exc_info=True)
            return False
            
    @api.model
    def _safe_float(self, value, default=0.0):
        """安全转换为浮点数"""
        if value is None:
            return default
        try:
            return float(value)
        except (ValueError, TypeError):
            return default
            
    @api.model
    def _safe_int(self, value, default=0):
        """安全转换为整数"""
        if value is None:
            return default
        try:
            return int(float(value))
        except (ValueError, TypeError):
            return default
            
    @api.model
    def _safe_str(self, value, default=''):
        """安全转换为字符串"""
        if value is None:
            return default
        try:
            return str(value)
        except (ValueError, TypeError):
            return default

class WindowSashData(models.Model):
    _name = 'window.sash.data'
    _description = '窗户嵌扇数据'
    
    calculation_id = fields.Many2one('window.calculation.result', string='计算结果', ondelete='cascade')
    result_id = fields.Many2one('window.calculation.result', string='计算结果', ondelete='cascade')
    
    # 基本信息
    batch = fields.Char(string='批次')
    style = fields.Char(string='风格')
    color = fields.Char(string='颜色')
    item_id = fields.Integer(string='ID')
    
    # 82-03系列
    sash_82_03 = fields.Float(string='82-03--')
    sash_82_03_pcs = fields.Integer(string='82-03Pcs')
    sash_82_03_vertical = fields.Float(string='82-03|')
    sash_82_03_vertical_pcs = fields.Integer(string='82-03|Pcs')
    
    # 82-05系列
    sash_82_05_vertical = fields.Float(string='82-05|')
    sash_82_05_vertical_pcs = fields.Integer(string='82-05|Pcs')
    
    # 82-04系列
    sash_82_04 = fields.Float(string='82-04--')
    sash_82_04_pcs = fields.Integer(string='82-04Pcs')
    sash_82_04_vertical = fields.Float(string='82-04|')
    sash_82_04_vertical_pcs = fields.Integer(string='82-04|Pcs')
    
    # 兼容旧字段
    material = fields.Char(string='材料')
    position = fields.Char(string='位置')
    length = fields.Float(string='长度')
    qty = fields.Integer(string='数量')
    name = fields.Char(string='名称')
    width = fields.Float(string='宽度')
    height = fields.Float(string='高度')
    quantity = fields.Integer(string='数量', default=1)
    data_json = fields.Text(string='原始数据')
    
    @api.model
    def create_from_data(self, data, calculation_id=None, result_id=None):
        """从字典数据创建记录"""
        if not data:
            return False
        
        parent = self.env['window.calculation.result'].browse(calculation_id)
        if not parent:
            return False
        
        try:
            vals = {
                'calculation_id': calculation_id,
                'result_id': result_id,
                'batch': parent._safe_str(data.get('batch')),
                'style': parent._safe_str(data.get('style')),
                'color': parent._safe_str(data.get('color')),
                'item_id': parent._safe_int(data.get('id')),
                
                # 82-03系列
                'sash_82_03': parent._safe_float(data.get('82-03--')),
                'sash_82_03_pcs': parent._safe_int(data.get('82-03Pcs')),
                'sash_82_03_vertical': parent._safe_float(data.get('82-03|')),
                'sash_82_03_vertical_pcs': parent._safe_int(data.get('82-03|Pcs')),
                
                # 82-05系列
                'sash_82_05_vertical': parent._safe_float(data.get('82-05|')),
                'sash_82_05_vertical_pcs': parent._safe_int(data.get('82-05|Pcs')),
                
                # 82-04系列
                'sash_82_04': parent._safe_float(data.get('82-04--')),
                'sash_82_04_pcs': parent._safe_int(data.get('82-04Pcs')),
                'sash_82_04_vertical': parent._safe_float(data.get('82-04|')),
                'sash_82_04_vertical_pcs': parent._safe_int(data.get('82-04|Pcs')),
                
                # 兼容旧字段
                'data_json': json.dumps(data)
            }
            return self.create(vals)
        except Exception as e:
            _logger.error(f"创建嵌扇数据错误: {str(e)}, 数据: {data}")
            return False

class WindowScreenData(models.Model):
    _name = 'window.screen.data'
    _description = '窗户屏幕数据'
    
    calculation_id = fields.Many2one('window.calculation.result', string='计算结果', ondelete='cascade')
    result_id = fields.Many2one('window.calculation.result', string='计算结果', ondelete='cascade')
    
    # 基本信息
    batch = fields.Char(string='批次')
    line_id = fields.Integer(string='行ID')
    style = fields.Char(string='风格')
    color = fields.Char(string='颜色')
    item_id = fields.Integer(string='ID')
    customer = fields.Char(string='客户')
    
    # 屏幕数据
    screenw = fields.Float(string='屏幕宽度')
    screenw_pcs = fields.Integer(string='屏幕宽度数量')
    screenh = fields.Float(string='屏幕高度')
    screenh_pcs = fields.Integer(string='屏幕高度数量')
    
    # 兼容旧字段
    material = fields.Char(string='材料')
    position = fields.Char(string='位置')
    length = fields.Float(string='长度')
    qty = fields.Integer(string='数量')
    name = fields.Char(string='名称')
    width = fields.Float(string='宽度')
    height = fields.Float(string='高度')
    quantity = fields.Integer(string='数量', default=1)
    data_json = fields.Text(string='原始数据')
    
    @api.model
    def create_from_data(self, data, calculation_id=None, result_id=None):
        """从字典数据创建记录"""
        vals = {
            'calculation_id': calculation_id,
            'result_id': result_id,
            'batch': data.get('batch', ''),
            'line_id': int(data.get('lineId', 0) or 0),
            'style': data.get('style', ''),
            'color': data.get('color', ''),
            'item_id': data.get('id'),
            'customer': data.get('customer', ''),
            
            # 屏幕数据
            'screenw': float(data.get('screenw', 0) or 0),
            'screenw_pcs': int(data.get('screenwPcs', 0) or 0),
            'screenh': float(data.get('screenh', 0) or 0),
            'screenh_pcs': int(data.get('screenhPcs', 0) or 0),
            
            # 兼容旧字段
            'material': data.get('material', ''),
            'position': data.get('position', ''),
            'length': float(data.get('length', 0) or 0),
            'qty': int(data.get('qty', 0) or 0),
            'data_json': json.dumps(data)
        }
        return self.create(vals)

class WindowPartsData(models.Model):
    _name = 'window.parts.data'
    _description = '窗户零部件数据'
    
    calculation_id = fields.Many2one('window.calculation.result', string='计算结果', ondelete='cascade')
    result_id = fields.Many2one('window.calculation.result', string='计算结果', ondelete='cascade')
    
    # 基本信息
    batch = fields.Char(string='批次')
    line_id = fields.Integer(string='行ID')
    style = fields.Char(string='风格')
    color = fields.Char(string='颜色')
    item_id = fields.Integer(string='ID')
    
    # 窗格和配件
    mullion = fields.Char(string='窗格条')
    center_alu = fields.Char(string='中心铝')
    handle_alu = fields.Char(string='把手铝')
    handle_pcs = fields.Integer(string='把手数量')
    track = fields.Char(string='轨道')
    cover_h = fields.Char(string='水平盖板')
    cover_v = fields.Char(string='垂直盖板')
    large_mullion = fields.Char(string='大窗格条')
    large_mullion_pcs = fields.Integer(string='大窗格条数量')
    large_mullion2 = fields.Char(string='第二大窗格条')
    large_mullion2_pcs = fields.Integer(string='第二大窗格条数量')
    slop = fields.Char(string='斜度')
    
    # 兼容旧字段
    material = fields.Char(string='材料')
    position = fields.Char(string='位置')
    length = fields.Float(string='长度')
    qty = fields.Integer(string='数量')
    name = fields.Char(string='名称')
    specs = fields.Char(string='规格')
    quantity = fields.Integer(string='数量', default=1)
    data_json = fields.Text(string='原始数据')
    
    @api.model
    def create_from_data(self, data, calculation_id=None, result_id=None):
        """从字典数据创建记录"""
        vals = {
            'calculation_id': calculation_id,
            'result_id': result_id,
            'batch': data.get('batch', ''),
            'line_id': int(data.get('lineId', 0) or 0),
            'style': data.get('style', ''),
            'color': data.get('color', ''),
            'item_id': data.get('id'),
            
            # 窗格和配件
            'mullion': data.get('mullion', ''),
            'center_alu': data.get('centerAlu', ''),
            'handle_alu': data.get('handleAlu', ''),
            'handle_pcs': int(data.get('handlePcs', 0) or 0),
            'track': data.get('track', ''),
            'cover_h': data.get('coverH', ''),
            'cover_v': data.get('coverV', ''),
            'large_mullion': data.get('largeMullion', ''),
            'large_mullion_pcs': int(data.get('largeMullionPcs', 0) or 0),
            'large_mullion2': data.get('largeMullion2', ''),
            'large_mullion2_pcs': int(data.get('largeMullion2Pcs', 0) or 0),
            'slop': data.get('slop', ''),
            
            # 兼容旧字段
            'data_json': json.dumps(data)
        }
        return self.create(vals)

class WindowGlassData(models.Model):
    _name = 'window.glass.data'
    _description = '窗户玻璃数据'
    
    calculation_id = fields.Many2one('window.calculation.result', string='计算结果', ondelete='cascade')
    result_id = fields.Many2one('window.calculation.result', string='计算结果', ondelete='cascade')
    line = fields.Integer(string='行号')
    qty = fields.Integer(string='数量')
    quantity = fields.Integer(string='数量', default=1)
    glass_type = fields.Char(string='玻璃类型')
    tempered = fields.Char(string='钢化')
    thickness = fields.Char(string='厚度')
    width = fields.Float(string='宽度')
    height = fields.Float(string='高度')
    name = fields.Char(string='名称')
    type = fields.Char(string='类型')
    data_json = fields.Text(string='原始数据')

class WindowGridData(models.Model):
    _name = 'window.grid.data'
    _description = '窗户网格数据'
    
    calculation_id = fields.Many2one('window.calculation.result', string='计算结果', ondelete='cascade')
    result_id = fields.Many2one('window.calculation.result', string='计算结果', ondelete='cascade')
    
    # 基本信息
    batch = fields.Char(string='批次')
    line_id = fields.Integer(string='行ID')
    style = fields.Char(string='风格')
    color = fields.Char(string='颜色')
    item_id = fields.Integer(string='ID')
    note = fields.Text(string='备注')
    
    # 网格数据
    # W1区域
    grid_w1 = fields.Float(string='W1')
    grid_w1_pcs = fields.Integer(string='W1数量')
    grid_w1_cut = fields.Boolean(string='W1一刀')
    
    # H1区域
    grid_h1 = fields.Float(string='H1')
    grid_h1_pcs = fields.Integer(string='H1数量')
    grid_h1_cut = fields.Boolean(string='H1一刀')
    
    # W2区域
    grid_w2 = fields.Float(string='W2')
    grid_w2_pcs = fields.Integer(string='W2数量')
    grid_w2_cut = fields.Boolean(string='W2一刀')
    
    # H2区域
    grid_h2 = fields.Float(string='H2')
    grid_h2_pcs = fields.Integer(string='H2数量')
    grid_h2_cut = fields.Boolean(string='H2一刀')
    
    # 用于计算的字段 (兼容旧代码)
    sash_grid_w = fields.Float(string='嵌扇格子宽度')
    sash_w_qty = fields.Integer(string='嵌扇横格数量')
    hole_w1 = fields.Float(string='嵌扇横格洞口')
    sash_grid_h = fields.Float(string='嵌扇格子高度')
    sash_h_qty = fields.Integer(string='嵌扇竖格数量')
    hole_h1 = fields.Float(string='嵌扇竖格洞口')
    fixed_grid_w = fields.Float(string='固定格子宽度')
    fixed_w_qty = fields.Integer(string='固定横格数量')
    hole_w2 = fields.Float(string='固定横格洞口')
    fixed_grid_h = fields.Float(string='固定格子高度')
    fixed_h_qty = fields.Integer(string='固定竖格数量')
    hole_h2 = fields.Float(string='固定竖格洞口')
    
    # 其他兼容旧字段
    name = fields.Char(string='名称')
    length = fields.Float(string='长度')
    material = fields.Char(string='材料')
    quantity = fields.Integer(string='数量', default=1)
    data_json = fields.Text(string='原始数据')
    
    @api.model
    def create_from_data(self, data, calculation_id=None, result_id=None):
        """从字典数据创建记录"""
        if not data:
            return False
        
        parent = self.env['window.calculation.result'].browse(calculation_id)
        if not parent:
            return False
        
        try:
            vals = {
                'calculation_id': calculation_id,
                'result_id': result_id,
                'batch': parent._safe_str(data.get('batch')),
                'line_id': parent._safe_int(data.get('lineId')),
                'style': parent._safe_str(data.get('style')),
                'color': parent._safe_str(data.get('color')),
                'item_id': parent._safe_int(data.get('id')),
                'note': parent._safe_str(data.get('note')),
                
                # 网格数据
                'grid_w1': parent._safe_float(data.get('gridW1')),
                'grid_w1_pcs': parent._safe_int(data.get('gridW1Pcs')),
                'grid_w1_cut': bool(data.get('gridW1Cut')),
                'grid_h1': parent._safe_float(data.get('gridH1')),
                'grid_h1_pcs': parent._safe_int(data.get('gridH1Pcs')),
                'grid_h1_cut': bool(data.get('gridH1Cut')),
                'grid_w2': parent._safe_float(data.get('gridW2')),
                'grid_w2_pcs': parent._safe_int(data.get('gridW2Pcs')),
                'grid_w2_cut': bool(data.get('gridW2Cut')),
                'grid_h2': parent._safe_float(data.get('gridH2')),
                'grid_h2_pcs': parent._safe_int(data.get('gridH2Pcs')),
                'grid_h2_cut': bool(data.get('gridH2Cut')),
                
                # 兼容旧字段
                'sash_grid_w': parent._safe_float(data.get('sashgridw')),
                'sash_w_qty': parent._safe_int(data.get('SashWq')),
                'hole_w1': parent._safe_float(data.get('holeW1')),
                'sash_grid_h': parent._safe_float(data.get('sashgridh')),
                'sash_h_qty': parent._safe_int(data.get('SashHq')),
                'hole_h1': parent._safe_float(data.get('holeH1')),
                'fixed_grid_w': parent._safe_float(data.get('fixedgridw')),
                'fixed_w_qty': parent._safe_int(data.get('FixWq')),
                'hole_w2': parent._safe_float(data.get('holeW2')),
                'fixed_grid_h': parent._safe_float(data.get('fixedgridh')),
                'fixed_h_qty': parent._safe_int(data.get('FixHq')),
                'hole_h2': parent._safe_float(data.get('holeH2')),
                'data_json': json.dumps(data)
            }
            return self.create(vals)
        except Exception as e:
            _logger.error(f"创建网格数据错误: {str(e)}, 数据: {data}")
            return False

class WindowGeneralInfo(models.Model):
    _name = 'window.general.info'
    _description = '窗户常规信息'
    
    calculation_id = fields.Many2one('window.calculation.result', string='计算结果', ondelete='cascade')
    result_id = fields.Many2one('window.calculation.result', string='计算结果', ondelete='cascade')
    
    # 基本信息
    batch = fields.Char(string='批次号')
    item_id = fields.Integer(string='ID')
    customer = fields.Char(string='客户')
    style = fields.Char(string='风格')
    width = fields.Float(string='宽度(W)')
    height = fields.Float(string='高度(H)')
    fh = fields.Char(string='固定高度(FH)')
    frame = fields.Char(string='框架(Frame)')
    glass = fields.Char(string='玻璃(Glass)')
    argon = fields.Boolean(string='氩气(Argon)', default=False)
    grid = fields.Char(string='格栅(Grid)')
    grid_size = fields.Char(string='格栅尺寸(Grid Size)')
    color = fields.Char(string='颜色(Color)')
    note = fields.Text(string='备注(Note)')
    
    # 窗户行关联
    window_line_id = fields.Many2one('rich_production.line', string='窗户行')
    production_id = fields.Many2one('rich.production.production', string='生产订单')
    
    @api.model
    def create_from_data(self, data, calculation_id=None, result_id=None):
        """从字典数据创建记录"""
        if not data:
            return False
        
        # 使用sudo提升权限
        self_sudo = self.sudo()
        
        try:
            # 使用安全类型转换
            parent = self.env['window.calculation.result'].sudo().browse(calculation_id) if calculation_id else False
            
            vals = {
                'calculation_id': calculation_id,
                'result_id': result_id or calculation_id,
                'item_id': parent._safe_int(data.get('id')) if parent else int(data.get('id', 0) or 0),
                'customer': data.get('customer', ''),
                'style': data.get('style', ''),
                'width': float(data.get('width', 0) or 0),
                'height': float(data.get('height', 0) or 0),
                'fh': data.get('fh', ''),
                'frame': data.get('frame', ''),
                'glass': data.get('glass', ''),
                'argon': data.get('argon') == 'Yes',
                'grid': data.get('grid', ''),
                'color': data.get('color', ''),
                'note': data.get('note', ''),
                'window_line_id': data.get('window_line_id'),
                'production_id': data.get('production_id')
            }
            return self_sudo.create(vals)
        except Exception as e:
            _logger.error(f"创建常规信息错误: {str(e)}, 数据: {data}")
            return False

class WindowLabelData(models.Model):
    _name = 'window.label.data'
    _description = '窗户标签数据'
    
    calculation_id = fields.Many2one('window.calculation.result', string='计算结果', ondelete='cascade')
    result_id = fields.Many2one('window.calculation.result', string='结果ID', ondelete='cascade')
    company_id = fields.Many2one('res.company', string='公司', required=True, default=lambda self: self.env.company)
    
    # 基本信息
    batch = fields.Char(string='批次号')
    line_id = fields.Char(string='行ID')
    style = fields.Char(string='风格')
    color = fields.Char(string='颜色')
    item_id = fields.Char(string='项目ID')
    
    # 标签特有信息
    customer = fields.Char(string='客户')
    width = fields.Float(string='宽度')
    height = fields.Float(string='高度')
    frame = fields.Char(string='框架')
    glass = fields.Char(string='玻璃')
    argon = fields.Boolean(string='氩气', default=False)
    grid = fields.Char(string='网格')
    grid_size = fields.Char(string='网格尺寸')
    po = fields.Char(string='订单号')
    
    @api.model
    def create_from_data(self, label_data, calculation_id, result_id):
        """从数据创建标签记录"""
        if not label_data:
            return False
            
        # 使用sudo提升权限
        self_sudo = self.sudo()
        
        try:
            # 使用安全类型转换
            parent = self.env['window.calculation.result'].sudo().browse(calculation_id) if calculation_id else False
            
            vals = {
                'calculation_id': calculation_id,
                'result_id': result_id,
                'batch': label_data.get('batch', ''),
                'line_id': label_data.get('lineId', ''),
                'style': label_data.get('style', ''),
                'color': label_data.get('color', ''),
                'item_id': label_data.get('id', ''),
                'customer': label_data.get('customer', ''),
                'width': float(label_data.get('width', 0) or 0),
                'height': float(label_data.get('height', 0) or 0),
                'frame': label_data.get('frame', ''),
                'glass': label_data.get('glass', ''),
                'argon': label_data.get('argon', False),
                'grid': label_data.get('grid', ''),
                'grid_size': label_data.get('gridSize', ''),
                'po': label_data.get('po', '')
            }
            
            return self_sudo.create(vals)
        except Exception as e:
            _logger.error(f"创建标签数据错误: {str(e)}, 数据: {label_data}")
            return False 