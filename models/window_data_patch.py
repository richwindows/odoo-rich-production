from odoo import models, api

class WindowCalculationResult(models.Model):
    _name = 'window.calculation.result'
    _description = '窗户计算结果'
    
    @api.model
    def _register_hook(self):
        # 确保模型正确注册
        return super(WindowCalculationResult, self)._register_hook()

class WindowFrameData(models.Model):
    _name = 'window.frame.data'
    _description = '窗户框架数据'
    
    @api.model
    def _register_hook(self):
        # 确保模型正确注册
        return super(WindowFrameData, self)._register_hook()

class WindowSashData(models.Model):
    _name = 'window.sash.data'
    _description = '窗户嵌扇数据'
    
    @api.model
    def _register_hook(self):
        # 确保模型正确注册
        return super(WindowSashData, self)._register_hook()

class WindowScreenData(models.Model):
    _name = 'window.screen.data'
    _description = '窗户屏幕数据'
    
    @api.model
    def _register_hook(self):
        # 确保模型正确注册
        return super(WindowScreenData, self)._register_hook()

class WindowPartsData(models.Model):
    _name = 'window.parts.data'
    _description = '窗户零部件数据'
    
    @api.model
    def _register_hook(self):
        # 确保模型正确注册
        return super(WindowPartsData, self)._register_hook()

class WindowGlassData(models.Model):
    _name = 'window.glass.data'
    _description = '窗户玻璃数据'
    
    @api.model
    def _register_hook(self):
        # 确保模型正确注册
        return super(WindowGlassData, self)._register_hook()

class WindowGridData(models.Model):
    _name = 'window.grid.data'
    _description = '窗户网格数据'
    
    @api.model
    def _register_hook(self):
        # 确保模型正确注册
        return super(WindowGridData, self)._register_hook() 