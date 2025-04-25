/** @odoo-module **/

import { registry } from "@web/core/registry";
import { Component, onWillStart, useState, onMounted } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { download } from "@web/core/network/download";
import { processWindowData } from "./window_calculations/xo_ox_window";

class CuttingListPreview extends Component {
    setup() {
        // 初始化params对象，确保安全
        const props = this.props || {};
        const params = props.params || {};
        
        // 从多个位置获取productionId（添加空值检查）
        let productionId = null;
        
        // 1. 直接从props.productionId获取
        if (props.productionId) {
            productionId = props.productionId;
        }
        // 2. 从props.action.productionId获取
        else if (props.action && props.action.productionId) {
            productionId = props.action.productionId;
        }
        // 3. 从params获取
        else if (params.productionId) {
            productionId = params.productionId;
        }
        // 4. 从props.action.params获取
        else if (props.action && props.action.params && props.action.params.productionId) {
            productionId = props.action.params.productionId;
        }
        
        this.state = useState({
            productionId: productionId,
            productLines: [],
            batchNumber: '',
            loading: true,
            activeTab: 'general-info',
            frameData: [],
            sashData: [],
            screenData: [],
            partsData: [],
            glassData: [],
            gridData: [],
        });
        
        this.orm = useService("orm");
        this.actionService = useService("action");
        this.notificationService = useService("notification");
        
        // 从导入的模块获取窗口计算函数
        this.XOOXWindowCalculator = { processWindowData };
        
        onWillStart(async () => {
            if (!this.state.productionId) {
                this.notificationService.add("无法获取生产ID，请重试", {
                    type: "danger",
                });
                
                // 尝试获取所有生产记录作为备选
                try {
                    const productions = await this.orm.searchRead(
                        "rich_production.production", 
                        [], // 不加过滤条件，获取所有记录
                        ["id", "batch_number", "name"],
                        { limit: 1, order: "id desc" } // 只获取最新一条
                    );
                    
                    if (productions && productions.length > 0) {
                        this.state.productionId = productions[0].id;
                    }
                } catch (error) {
                    console.error("获取生产记录失败:", error);
                }
            }
            
            await this.loadData();
        });

        onMounted(() => {
            this.loadData();
        });
    }
    
    async loadData() {
        try {
            this.state.loading = true;
            
            if (!this.state.productionId) {
                this.state.productLines = [];
                this.notificationService.add("无法获取有效的生产记录ID，请从生产界面点击下料单按钮", { type: "danger" });
                return;
            }
            
            // 创建空表格的模型
            const createEmptyTable = () => {
                this.state.productLines = [];
                this.state.loading = false;
                // 添加一个示例行，便于用户理解表格结构
                this.state.productLines.push({
                    id: 1,
                    customer: '(示例)',
                    style: 'XO',
                    width: '36',
                    height: '48',
                    fh: '',
                    frame: '白色',
                    glass: '双层',
                    argon: 'Yes',
                    grid: '',
                    color: '白色',
                    note: '这是示例数据，请添加产品后重试',
                });
            };
            
            try {
                const productions = await this.orm.searchRead(
                    "rich_production.production", 
                    [["id", "=", this.state.productionId]],
                    ["batch_number", "product_line_ids"]
                );
                
                if (!productions || productions.length === 0) {
                    console.error("找不到指定ID的生产记录");
                    this.notificationService.add("找不到指定的生产记录，请返回生产界面重试", { type: "warning" });
                    createEmptyTable();
                    return;
                }
                
                this.state.batchNumber = productions[0].batch_number || '';
                
                if (!productions[0].product_line_ids || productions[0].product_line_ids.length === 0) {
                    console.warn("生产记录没有关联的产品行");
                    this.notificationService.add("该生产记录中没有产品数据，请先添加产品", { type: "warning" });
                    createEmptyTable();
                    return;
                }
                
                try {
                    // 先尝试获取一个产品行的所有字段，用于调试
                    const sampleLine = await this.orm.searchRead(
                        "rich_production.line", 
                        [["id", "=", productions[0].product_line_ids[0]]],
                        []  // 不指定字段，获取所有字段
                    );
                    
                    // 检查字段存在情况，确定实际可用字段
                    let availableFields = [];
                    const essentialFields = ["product_id"];
                    const optionalFields = ["width", "height", "frame", "glass", "argon", 
                                         "grid", "grid_size", "color", "notes", "invoice_id", "quantity", "product_qty"];
                    
                    if (sampleLine && sampleLine.length > 0) {
                        for (const field of essentialFields) {
                            if (field in sampleLine[0]) {
                                availableFields.push(field);
                            } else {
                                console.warn(`缺少必要字段: ${field}`);
                            }
                        }
                        
                        for (const field of optionalFields) {
                            if (field in sampleLine[0]) {
                                availableFields.push(field);
                            } else {
                                console.warn(`字段不可用: ${field}`);
                            }
                        }
                    }
                    
                    // 使用确认可用的字段获取产品行数据
                    const lines = await this.orm.searchRead(
                        "rich_production.line", 
                        [["production_id", "=", this.state.productionId]],
                        availableFields
                    );
                    
                    if (lines && lines.length > 0) {
                        const processedLines = [];
                        let itemId = 1;
                        
                        for (let index = 0; index < lines.length; index++) {
                            const line = lines[index];
                            
                            // 确定产品数量
                            let quantity = 1; // 默认为1
                            if (line.quantity !== undefined) {
                                try {
                                    quantity = parseInt(line.quantity);
                                } catch (e) {
                                    console.warn("无法解析quantity值:", line.quantity);
                                }
                            } else if (line.product_qty !== undefined) {
                                try {
                                    quantity = parseInt(line.product_qty);
                                } catch (e) {
                                    console.warn("无法解析product_qty值:", line.product_qty);
                                }
                            }
                            
                            const actualQuantity = Math.max(1, quantity);
                            
                            // 准备客户信息和产品信息
                            let customerCode = '';
                            let style = '';
                            
                            // 处理产品信息 - 安全地获取产品名称
                            let productName = '';
                            if (line.product_id) {
                                if (Array.isArray(line.product_id) && line.product_id.length > 1) {
                                    productName = line.product_id[1] || '';
                                } else if (typeof line.product_id === 'object' && line.product_id.name) {
                                    productName = line.product_id.name;
                                } else {
                                    productName = String(line.product_id);
                                }
                                
                                // 尝试从产品名称中提取风格类型
                                if (productName.includes('XOX')) {
                                    style = 'XOX';
                                } else if (productName.includes('XO')) {
                                    style = 'XO';
                                } else if (productName.includes('OX')) {
                                    style = 'OX';
                                } else if (productName.includes('Picture')) {
                                    style = 'P';
                                } else if (productName.includes('Casement')) {
                                    style = 'C';
                                } else {
                                    style = productName;
                                }
                            }
                            
                            // 获取客户信息 - 如果有发票ID
                            if (line.invoice_id) {
                                try {
                                    let invoiceId = null;
                                    if (Array.isArray(line.invoice_id) && line.invoice_id.length > 0) {
                                        invoiceId = line.invoice_id[0];
                                    } else if (typeof line.invoice_id === 'number') {
                                        invoiceId = line.invoice_id;
                                    }
                                    
                                    if (invoiceId) {
                                        const invoices = await this.orm.searchRead(
                                            "account.move",
                                            [["id", "=", invoiceId]],
                                            ["partner_id"]
                                        );
                                        
                                        if (invoices && invoices.length > 0 && invoices[0].partner_id) {
                                            const customer = Array.isArray(invoices[0].partner_id) ? 
                                                invoices[0].partner_id[1] || '' : 
                                                (invoices[0].partner_id.name || '');
                                                
                                            // 如果客户名称太长，截取前8个字符加ID
                                            if (customer && customer.length > 10) {
                                                const partnerId = Array.isArray(invoices[0].partner_id) ?
                                                    invoices[0].partner_id[0] : invoices[0].partner_id.id;
                                                customerCode = customer.substring(0, 8) + 
                                                    String(partnerId % 100000);
                                            } else {
                                                customerCode = customer;
                                            }
                                        }
                                    }
                                } catch (invoiceError) {
                                    console.warn("获取客户信息失败", invoiceError);
                                }
                            }
                            
                            // 为每个数量创建一行，安全获取字段值
                            for (let i = 0; i < actualQuantity; i++) {
                                const lineObj = {
                                    id: itemId,
                                    customer: customerCode,
                                    style: style,
                                    width: line.width || '',
                                    height: line.height || '',
                                    fh: '',
                                    frame: line.frame || '',
                                    glass: line.glass || '',
                                    argon: line.argon ? 'Yes' : '',
                                    grid: line.grid || '',
                                    grid_size: line.grid_size || '',
                                    color: line.color || '',
                                    note: line.notes || '',
                                };
                                
                                processedLines.push(lineObj);
                                itemId++;
                            }
                        }
                        
                        if (processedLines.length > 0) {
                            this.state.productLines = processedLines;
                        } else {
                            console.warn("处理后没有产品行数据");
                            this.notificationService.add("处理后没有产品行数据", { type: "warning" });
                            createEmptyTable();
                        }
                    } else {
                        console.warn("没有找到产品行数据");
                        this.notificationService.add("该生产记录中没有产品行数据", { type: "warning" });
                        createEmptyTable();
                    }
                } catch (searchReadError) {
                    console.error("获取产品行数据失败:", searchReadError);
                    
                    // 回退到使用最小字段集
                    try {
                        // console.log("尝试使用最小字段集获取产品行...");
                        const minimalLines = await this.orm.searchRead(
                            "rich_production.line", 
                            [["production_id", "=", this.state.productionId]],
                            ["product_id"]  // 只获取产品ID字段
                        );
                        
                        if (minimalLines && minimalLines.length > 0) {
                            // console.log("使用最小字段集获取到产品行:", minimalLines.length, "条");
                            const processedLines = [];
                            
                            // 创建简化的行数据
                            for (let i = 0; i < minimalLines.length; i++) {
                                const line = minimalLines[i];
                                processedLines.push({
                                    id: i + 1,
                                    customer: '(数据有误)',
                                    style: line.product_id ? (Array.isArray(line.product_id) ? line.product_id[1] : 'Product') : 'Product',
                                    width: '',
                                    height: '',
                                    fh: '',
                                    frame: '',
                                    glass: '',
                                    argon: '',
                                    grid: '',
                                    color: '',
                                    note: '数据读取出错，请联系管理员',
                                });
                            }
                            
                            this.state.productLines = processedLines;
                            this.notificationService.add("某些产品数据读取失败，显示简化信息", { type: "warning" });
                        } else {
                            throw new Error("无法获取产品行基本信息");
                        }
                    } catch (minimalError) {
                        console.error("使用最小字段集获取数据也失败:", minimalError);
                        this.notificationService.add("无法获取产品数据: " + (searchReadError.message || '未知错误'), { type: "danger" });
                        createEmptyTable();
                    }
                }
            } catch (dataError) {
                console.error("获取数据时出错:", dataError);
                this.notificationService.add(`加载数据失败: ${dataError.message || '服务器错误'}`, { type: "danger" });
                createEmptyTable();
            }
        } catch (error) {
            console.error("加载下料单数据失败", error);
            this.notificationService.add(`加载下料单数据失败: ${error.message || '未知错误'}`, { type: "danger" });
            // 创建空表格
            this.state.productLines = [];
            this.state.loading = false;
        } finally {
            this.state.loading = false;
        }
        
        // 所有数据加载完成后处理窗户数据
        console.log('数据加载完成，开始处理窗户数据...');
        await this.processWindowData();
    }
    
    async processWindowData() {
        // Reset all data arrays
        this.state.frameData = [];
        this.state.sashData = [];
        this.state.screenData = [];
        this.state.partsData = [];
        this.state.glassData = [];
        this.state.gridData = [];

        console.log('开始处理窗户数据，窗户数量:', this.state.productLines.length);

        // Process each window - 使用for循环而不是forEach以便使用await
        for (let index = 0; index < this.state.productLines.length; index++) {
            const window = this.state.productLines[index];
            try {
                console.log(`处理窗户 #${index+1}:`, window);
                
                // 调用窗户计算函数 - 使用await等待异步结果
                const calculations = await this.XOOXWindowCalculator.processWindowData(window);
                
                console.log(`窗户 #${index+1} 计算结果:`, calculations);
                
                // Store calculations for later use
                window.calculations = calculations;
                
                // 确保calculations对象有效
                if (!calculations) {
                    console.warn(`窗户 #${index+1} 计算结果为空`);
                    continue;
                }
                
                // Format frame data for display in the frame details table
                const frameData = this.formatFrameData(window, calculations);
                console.log(`窗户 #${index+1} 框架数据:`, frameData);
                if (frameData) {
                    this.state.frameData.push(frameData);
                }
                
                // Format sash data for display in the sash details table
                const sashData = this.formatSashData(window, calculations);
                console.log(`窗户 #${index+1} 嵌扇数据:`, sashData);
                if (sashData) {
                    this.state.sashData.push(sashData);
                }
                
                // Format screen data for display in the screen table
                const screenData = this.formatScreenData(window, calculations);
                console.log(`窗户 #${index+1} 屏幕数据:`, screenData);
                if (screenData) {
                    this.state.screenData.push(screenData);
                }
                
                // Format parts data for display in the parts table
                const partsData = this.formatPartsData(window, calculations);
                console.log(`窗户 #${index+1} 配件数据:`, partsData);
                if (partsData) {
                    this.state.partsData.push(partsData);
                }
                
                // Format glass data for display in the glass table
                const glassData = this.formatGlassData(window, calculations);
                console.log(`窗户 #${index+1} 玻璃数据:`, glassData);
                if (glassData && glassData.length > 0) {
                    this.state.glassData.push(...glassData);
                }
                
                // Format grid data for display in the grid table
                const gridData = this.formatGridData(window, calculations);
                console.log(`窗户 #${index+1} 网格数据:`, gridData);
                if (gridData) {
                    this.state.gridData.push(gridData);
                }
            } catch (error) {
                console.error(`处理窗户 #${index+1} 时发生错误:`, error);
            }
        }
        
        // 对Glass数据按ID和lineNumber排序
        if (this.state.glassData && this.state.glassData.length > 0) {
            // 先按ID排序，再按lineNumber排序
            this.state.glassData.sort((a, b) => {
                if (a.id !== b.id) {
                    return a.id - b.id;
                }
                return a.lineNumber - b.lineNumber;
            });
            
            // 标记每个ID的第一行
            let currentId = null;
            this.state.glassData.forEach(item => {
                if (item.id !== currentId) {
                    item.isFirstLine = true;
                    currentId = item.id;
                } else {
                    item.isFirstLine = false;
                }
            });
        }
        
        // 输出最终结果
        console.log('数据处理完成，最终结果:');
        console.log('- 框架数据:', this.state.frameData.length, '条', this.state.frameData);
        console.log('- 嵌扇数据:', this.state.sashData.length, '条', this.state.sashData);
        console.log('- 屏幕数据:', this.state.screenData.length, '条', this.state.screenData);
        console.log('- 配件数据:', this.state.partsData.length, '条', this.state.partsData);
        console.log('- 玻璃数据:', this.state.glassData.length, '条', this.state.glassData);
        console.log('- 网格数据:', this.state.gridData.length, '条', this.state.gridData);
    }
    
    /**
     * 格式化框架数据用于表格显示
     * @param {Object} window - 窗户数据
     * @param {Object} calculations - 计算结果
     * @returns {Object} 表格显示格式的框架数据
     */
    formatFrameData(window, calculations) {
        try {
            // 使用直接解构获取frame数组
            const frameList = calculations.frame || [];
            
            if (!Array.isArray(frameList) || frameList.length === 0) {
                console.warn(`窗户ID=${window.id} frame数组为空或无效`);
                return null;
            }

            console.log(`窗户ID=${window.id} frame原始数据:`, frameList);

            // 创建一个新对象用于存储表格数据
            const tableData = {
                batch: this.state.batchNumber,
                style: window.style || '',
                id: window.id,
                color: window.color || '',
                frameType: calculations.frameType || window.frame || '',
                // 表格中实际使用的列名（与XML模板中的列名完全一致）
                '82-02B--': '',
                '82-02BPcs': '',
                '82-02B|': '',
                '82-02B|Pcs': '',
                '82-10--': '',
                '82-10Pcs': '',
                '82-10|': '',
                '82-10|Pcs': '',
                '82-01--': '',
                '82-01Pcs': '',
                '82-01|': '',
                '82-01|Pcs': ''
               
            };

            // 遍历框架元素列表
            frameList.forEach(item => {
                const { material, position, length, qty } = item;
                
                if (!material || !position || !length) {
                    console.warn(`窗户ID=${window.id} 框架元素数据不完整:`, item);
                    return;
                }
                
                console.log(`处理框架元素: 材料=${material}, 位置=${position}, 长度=${length}, 数量=${qty}`);
                
                // 材料映射 - 例如将82-02映射到82-02B
                let materialMapping = {
                    '82-02': '82-02B',
                    '82-02B': '82-02B',
                    '82-10': '82-10',
                    '82-01': '82-01'
                };
                
                // 获取映射后的材料编号
                const mappedMaterial = materialMapping[material] || material;
                
                // 构建完全匹配表格的列名
                // 针对不同位置构建不同的列名
                let lengthColumn, qtyColumn;
                
                if (position === '|') {
                    lengthColumn = `${mappedMaterial}${position}`;
                    qtyColumn = `${mappedMaterial}${position}Pcs`;
                } else if (position === '--') {
                    lengthColumn = `${mappedMaterial}--`;
                    qtyColumn = `${mappedMaterial}Pcs`;
                } else {
                    // 默认情况下，将其他position都视为'--'
                    lengthColumn = `${mappedMaterial}--`;
                    qtyColumn = `${mappedMaterial}Pcs`;
                }
                
                console.log(`映射后的列名: 长度列=${lengthColumn}, 数量列=${qtyColumn}`);
                
                // 设置长度和数量
                if (lengthColumn in tableData) {
                    tableData[lengthColumn] = length;
                    tableData[qtyColumn] = qty;
                } else {
                    console.warn(`列名 "${lengthColumn}" 不存在于表格数据中，映射失败`);
                }
            });

            console.log(`窗户ID=${window.id} 最终框架表格数据:`, tableData);
            return tableData;
        } catch (error) {
            console.error(`Error formatting frame data for window ID=${window.id}:`, error);
            return null;
        }
    }
    
    /**
     * 格式化框架数据用于表格显示
     * @param {Object} window - 窗户数据
     * @param {Object} calculations - 计算结果
     * @returns {Object} 表格显示格式的框架数据
     */
    formatSashData(window, calculations) {
        try {
            // 使用直接解构获取sash数组
            const sashList = calculations.sash || [];
            
            if (!Array.isArray(sashList) || sashList.length === 0) {
                console.warn(`窗户ID=${window.id} sash数组为空或无效`);
                return null;
            }

            console.log(`窗户ID=${window.id} sash原始数据:`, sashList);

            // 创建一个新对象用于存储表格数据
            const tableData = {
                batch: this.state.batchNumber,
                style: window.style || '',
                id: window.id,
                color: window.color || '',
                frameType: calculations.frameType || window.frame || '',
                // 表格中实际使用的列名（与XML模板中的列名完全一致）
              
                // 添加嵌扇专用材料列
                '82-03--': '',
                '82-03Pcs': '',
                '82-03|': '',
                '82-03|Pcs': '',
                '82-05--': '',
                '82-05Pcs': '',
                '82-05|': '',
                '82-05|Pcs': '',
                '82-04--': '',
                '82-04Pcs': '',
                '82-04|': '',
                '82-04|Pcs': ''
            };

            // 遍历嵌扇元素列表
            sashList.forEach(item => {
                const { material, position, length, qty } = item;
                
                if (!material || !position || !length) {
                    console.warn(`窗户ID=${window.id} 嵌扇元素数据不完整:`, item);
                    return;
                }
                
                console.log(`处理嵌扇元素: 材料=${material}, 位置=${position}, 长度=${length}, 数量=${qty}`);
                
                // 材料映射 - 例如将82-02映射到82-02B
                let materialMapping = {
                    '82-02': '82-02B',
                    '82-02B': '82-02B',
                    '82-10': '82-10',
                    '82-01': '82-01',
                    '82-03': '82-03',
                    '82-04': '82-04',
                    '82-05': '82-05'
                };
                
                // 获取映射后的材料编号
                const mappedMaterial = materialMapping[material] || material;
                
                // 构建完全匹配表格的列名
                let lengthColumn, qtyColumn;
                
                if (position === '|') {
                    lengthColumn = `${mappedMaterial}${position}`;
                    qtyColumn = `${mappedMaterial}${position}Pcs`;
                } else if (position === '--') {
                    lengthColumn = `${mappedMaterial}--`;
                    qtyColumn = `${mappedMaterial}Pcs`;
                } else {
                    // 默认情况下，将其他position都视为'--'
                    lengthColumn = `${mappedMaterial}--`;
                    qtyColumn = `${mappedMaterial}Pcs`;
                }
                
                console.log(`映射后的列名: 长度列=${lengthColumn}, 数量列=${qtyColumn}`);
                
                // 设置长度和数量
                if (lengthColumn in tableData) {
                    tableData[lengthColumn] = length;
                    tableData[qtyColumn] = qty;
                } else {
                    console.warn(`列名 "${lengthColumn}" 不存在于表格数据中，映射失败`);
                }
            });

            console.log(`窗户ID=${window.id} 最终嵌扇表格数据:`, tableData);
            return tableData;
        } catch (error) {
            console.error(`Error formatting sash data for window ID=${window.id}:`, error);
            return null;
        }
    }
    
    /**
     * 格式化屏幕数据用于表格显示
     * @param {Object} window - 窗户数据
     * @param {Object} calculations - 计算结果
     * @returns {Object} 表格显示格式的屏幕数据
     */
    formatScreenData(window, calculations) {
        try {
            // 获取屏幕尺寸数据
            let screenw = '';
            let screenh = '';
            let screenwPcs = 0;
            let screenhPcs = 0;
            
            // 优先使用计算模块返回的screen数据
            if (calculations && calculations.screen && Array.isArray(calculations.screen)) {
                calculations.screen.forEach(item => {
                    if (item.material === 'screenw' && item.position === '--') {
                        screenw = item.length;
                        screenwPcs = item.qty;
                    }
                    if (item.material === 'screenh' && item.position === '|') {
                        screenh = item.length;
                        screenhPcs = item.qty;
                    }
                });
            } 
            // 回退到calculations.screenw和screenh
            else if (calculations && calculations.screenw !== undefined && calculations.screenh !== undefined) {
                screenw = calculations.screenw;
                screenh = calculations.screenh;
                screenwPcs = 2;
                screenhPcs = 2;
            } 
            // 回退到window对象本身的screenw和screenh
            else if (window.screenw !== undefined && window.screenh !== undefined) {
                screenw = window.screenw;
                screenh = window.screenh;
                screenwPcs = 1;
                screenhPcs = 1;
            }
            
            if (!screenw && !screenh) {
                // 没有屏幕数据，跳过
                return null;
            }
            
            // 创建屏幕信息记录
            const screenData = {
                id: window.id,
                lineId: window.id,
                customer: window.customer || '',
                style: window.style || '',
                screenw: screenw,
                screenwPcs: screenwPcs,
                screenh: screenh,
                screenhPcs: screenhPcs,
                color: window.color || ''
            };
            
            return screenData;
        } catch (error) {
            console.error('Error formatting screen data:', error);
            return null;
        }
    }
    
    /**
     * 格式化配件数据用于表格显示
     * @param {Object} window - 窗户数据
     * @param {Object} calculations - 计算结果
     * @returns {Object} 表格显示格式的配件数据
     */
    formatPartsData(window, calculations) {
        try {
            // 创建配件数据对象
            const partsData = {
                id: window.id,
                lineId: window.id,
                batch: this.state.batchNumber,
                style: window.style || '',
                frameType: calculations.frameType || '',
                color: window.color || '',
                // 窗中梃
                mullion: '',
                // 中铝
                centerAlu: '',
                // 手铝和数量
                handleAlu: '',
                handlePcs: '',
                // 轨道
                track: '',
                // 盖板
                coverH: '',
                coverV: '',
                // 大中梃
                largeMullion: '',
                largeMullionPcs: '',
                largeMullion2: '',
                largeMullion2Pcs: '',
                // 斜度
                slop: ''
            };
            
            // 检查是否有计算模块返回的parts数据
            if (calculations && calculations.parts && Array.isArray(calculations.parts)) {
                // 遍历parts数据并填充到表格数据对象中
                calculations.parts.forEach(part => {
                    const { material, position, length, qty } = part;
                    
                    // 根据material类型和position设置对应字段
                    if (material === 'mullion' && position === '|') {
                        partsData.mullion = length;
                    } 
                    else if (material === 'mullion aluminum' && position === '|') {
                        partsData.centerAlu = length;
                    }
                    else if (material === 'handle aluminum' && position === '|') {
                        partsData.handleAlu = length;
                        partsData.handlePcs = qty || 1;
                    }
                    else if (material === 'track' && position === '--') {
                        partsData.track = length;
                    }
                    else if (material === 'big mullion') {
                        partsData.largeMullion = length;
                        partsData.largeMullionPcs = qty || 1;
                    }
                    else if (material === 'big mullion2') {
                        partsData.largeMullion2 = length;
                        partsData.largeMullion2Pcs = qty || 1;
                    }
                    else if (material === 'cover' && position === '--') {
                        partsData.coverH = length;
                    }
                    else if (material === 'cover' && position === '|') {
                        partsData.coverV = length;
                    }
                    else if (material === 'slop') {
                        partsData.slop = length;
                    }
                });
            } 
            // 回退到旧的计算方式
            else if (calculations && calculations.basics) {
                // 使用计算的mullion数据
                if (window.mullion !== undefined) {
                    partsData.mullion = window.mullion;
                }
                if (window.mullionA !== undefined) {
                    partsData.largeMullion = window.mullionA;
                    partsData.largeMullionPcs = 1;
                }
                
                // 使用计算的track数据
                if (window.track !== undefined) {
                    partsData.track = window.track;
                }
                
                // 使用计算的handle位置
                if (window.handleA !== undefined) {
                    partsData.handleAlu = window.handleA;
                    partsData.handlePcs = 1;
                }
            }
            
            // 如果没有任何数据,返回null
            if (!partsData.mullion && !partsData.centerAlu && !partsData.handleAlu && 
                !partsData.track && !partsData.coverH && !partsData.coverV && 
                !partsData.largeMullion && !partsData.largeMullion2 && !partsData.slop) {
                return null;
            }
            
            return partsData;
        } catch (error) {
            console.error('Error formatting parts data:', error);
            return null;
        }
    }
    
    /**
     * 格式化玻璃数据用于表格显示
     * @param {Object} window - 窗户数据
     * @param {Object} calculations - 计算结果
     * @returns {Array} 表格显示格式的玻璃数据数组
     */
    formatGlassData(window, calculations) {
        try {
            // 创建结果数组
            const glassDataArray = [];
            
            // 确保窗户有足够的信息
            if (!window.width || !window.height) {
                return [];
            }
            
            // 从计算结果中获取玻璃尺寸
            if (calculations && calculations.glassList && Array.isArray(calculations.glassList)) {
                // 使用glassList数据
                calculations.glassList.forEach(glass => {
                    // 创建玻璃数据对象
                    const glassData = {
                        batch: this.state.batchNumber,
                        customer: window.customer || '',
                        style: window.style || '',
                        width: window.width || '',
                        height: window.height || '',
                        fh: window.fh || '',
                        id: window.id,
                        lineNumber: glass.line || '',
                        quantity: glass.qty || 1,
                        glassType: glass.glassType || window.glass || '',
                        tempered: glass.Tmprd || window.tempered || '',
                        thickness: glass.Thickness || window.thickness || '3',
                        glassWidth: glass.width  || '',
                        glassHeight: glass.height  || '',
                        grid: window.grid || '',
                        argon: window.argon ? 'Yes' : ''
                    };
                    
                    glassDataArray.push(glassData);
                });
            } 
            // 如果没有glassList，尝试使用glass对象
            else if (calculations && calculations.glass) {
                let glasses = [];
                
                // 如果glass是数组，直接使用
                if (Array.isArray(calculations.glass)) {
                    glasses = calculations.glass;
                } 
                // 如果glass是对象，转换为数组
                else if (typeof calculations.glass === 'object') {
                    glasses = [calculations.glass];
                }
                
                // 处理每个玻璃项
                glasses.forEach((glass, index) => {
                    const glassData = {
                        batch: this.state.batchNumber,
                        customer: window.customer || '',
                        style: window.style || '',
                        width: window.width || '',
                        height: window.height || '',
                        fh: window.fh || '',
                        id: window.id,
                        lineNumber: index + 1,
                        quantity: glass.qty || 1,
                        glassType: glass.type || window.glass || '',
                        tempered: glass.tempered || window.tempered || '',
                        thickness: glass.thickness || window.thickness || '3',
                        glassWidth: glass.width || '',
                        glassHeight: glass.height || '',
                        grid: window.grid || '',
                        argon: window.argon ? 'Yes' : ''
                    };
                    
                    glassDataArray.push(glassData);
                });
            }
           
            
            // 如果没有生成任何数据，返回空数组
            return glassDataArray;
        } catch (error) {
            console.error('Error formatting glass data:', error);
            return [];
        }
    }
    
    printPage() {
        window.print();
    }
    
    async downloadExcel() {
        try {
            if (!this.state.productionId) {
                this.notificationService.add("无法获取生产ID，无法下载Excel", {
                    type: "danger",
                });
                return;
            }
            
            // 显示加载中通知
            this.notificationService.add("Excel生成中，请稍候...", {
                type: "info",
            });
            
            // 直接使用生产ID构建下载URL
            const url = `/rich_production/download_excel/${this.state.productionId}`;
            
            // 使用fetch API直接下载文件
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'same-origin',
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            // 获取文件名
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `cutting_list_${this.state.productionId}.xlsx`;
            
            if (contentDisposition) {
                const filenameMatch = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1].replace(/['"]/g, '');
                }
            }
            
            // 获取blob数据
            const blob = await response.blob();
            
            // 创建下载链接
            const url_object = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url_object;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            
            // 清理
            window.URL.revokeObjectURL(url_object);
            document.body.removeChild(link);
            
            // 显示成功通知
            this.notificationService.add("Excel文件下载成功", {
                type: "success",
            });
        } catch (error) {
            console.error("下载Excel文件失败", error);
            this.notificationService.add(`下载Excel文件失败: ${error.message || '未知错误'}`, {
                type: "danger",
            });
        }
    }
    
    async downloadPdf() {
        try {
            if (!this.state.productionId) {
                this.notificationService.add("无法获取生产ID，无法下载PDF", {
                    type: "danger",
                });
                return;
            }
            
            // 显示加载中通知
            this.notificationService.add("PDF生成中，请稍候...", {
                type: "info",
            });
            
            // 直接使用生产ID构建下载URL
            const url = `/rich_production/print_pdf/${this.state.productionId}`;
            
            // 使用fetch API直接下载文件
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'same-origin',
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            // 获取文件名
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `cutting_list_${this.state.productionId}.pdf`;
            
            if (contentDisposition) {
                const filenameMatch = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1].replace(/['"]/g, '');
                }
            }
            
            // 获取blob数据
            const blob = await response.blob();
            
            // 创建下载链接
            const url_object = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url_object;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            
            // 清理
            window.URL.revokeObjectURL(url_object);
            document.body.removeChild(link);
            
            // 显示成功通知
            this.notificationService.add("PDF文件下载成功", {
                type: "success",
            });
        } catch (error) {
            console.error("下载PDF文件失败", error);
            this.notificationService.add(`下载PDF文件失败: ${error.message || '未知错误'}`, {
                type: "danger",
            });
        }
    }
    
    close() {
        this.actionService.doAction({ type: "ir.actions.act_window_close" });
    }
    
    /**
     * Format grid data for display in the grid table
     * @param {Object} window - Window data
     * @param {Object} calculations - Calculation results
     * @returns {Object} Formatted grid data for table display
     */
    formatGridData(window, calculations) {
        try {
            // 确保window存在
            if (!window) {
                console.warn('window参数为空，无法格式化grid数据');
                return null;
            }
            
            // 获取grid值，并转换为小写用于比较
            const gridValue = window.grid || '';
            const gridLower = typeof gridValue === 'string' ? gridValue.toLowerCase() : '';
            
            // Skip if window doesn't have grid
            if (!gridValue || gridLower === 'no' || gridLower === 'none') {
                console.warn('window没有grid或grid为no/none，跳过:', gridValue);
                return null;
            }
            
            // Extract grid style and size information
            let gridStyle = gridValue;
            
            // If grid_size exists separately and isn't already included in grid
            if (window.grid_size && !gridStyle.includes(window.grid_size)) {
                gridStyle = `${gridStyle} ${window.grid_size}`;
            }
            
            // 检查计算模块是否已返回grid数据
            if (!calculations) {
                console.warn('calculations参数为空，无法显示grid数据');
                return null;
            }
            
            if (!calculations.gridList || calculations.gridList.length === 0) {
                console.warn('没有找到gridList或gridList为空', calculations);
                return null;
            }
            
            // 使用计算模块返回的grid数据
            const gridData = calculations.gridList[0];
            
            // 从计算结果中提取数据
            let w1 = 0, w1Pcs = 0, h1 = 0, h1Pcs = 0;  // Sash grid dimensions
            let w2 = 0, w2Pcs = 0, h2 = 0, h2Pcs = 0;  // Fixed grid dimensions
            let holeW1 = 0, holeH1 = 0, holeW2 = 0, holeH2 = 0; // Hole dimensions
            
            if (gridData) {
                // 提取嵌扇格子数据
                w1 = gridData.sashgridw || 0;
                w1Pcs = gridData.SashWq || 0;
                holeW1 = gridData.holeW1 || 0;
                h1 = gridData.sashgridh || 0;
                h1Pcs = gridData.SashHq || 0;
                holeH1 = gridData.holeH1 || 0;
                
                // 提取固定格子数据
                w2 = gridData.fixedgridw || 0;
                w2Pcs = gridData.FixWq || 0;
                holeW2 = gridData.holeW2 || 0;
                h2 = gridData.fixedgridh || 0;
                h2Pcs = gridData.FixHq || 0;
                holeH2 = gridData.holeH2 || 0;
            } else {
                console.warn('gridData为空，无法提取grid数据');
            }
            
            // Create grid data object for table
            const result = {
                batch: this.state.batchNumber,
                style: window.style,
                gridStyle: gridStyle,
                id: window.id,
                color: window.color,
                note: window.note || '',
                
                // Sash grid dimensions
                w1: w1 ? w1.toFixed(1) : '',
                w1Pcs: w1Pcs || '',
                w1Cut: w1Pcs > 0 ? holeW1.toFixed(1) : '',  // Show cut dimension if there are pieces
                h1: h1 ? h1.toFixed(1) : '',
                h1Pcs: h1Pcs || '',
                h1Cut: h1Pcs > 0 ? holeH1.toFixed(1) : '',
                
                // Fixed grid dimensions
                w2: w2 ? w2.toFixed(1) : '',
                w2Pcs: w2Pcs || '',
                w2Cut: w2Pcs > 0 ? holeW2.toFixed(1) : '',
                h2: h2 ? h2.toFixed(1) : '',
                h2Pcs: h2Pcs || '',
                h2Cut: h2Pcs > 0 ? holeH2.toFixed(1) : ''
            };
            
            return result;
        } catch (error) {
            console.error('Error formatting grid data:', error);
            return null;
        }
    }
}

CuttingListPreview.template = "rich_production.CuttingListPreview";
CuttingListPreview.props = {
    productionId: { type: [Number, String, Boolean], optional: true },
    params: { type: Object, optional: true },
};

// 注册为客户端动作
registry.category("actions").add("rich_production.cutting_list_preview", CuttingListPreview);

export default CuttingListPreview; 