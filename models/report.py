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