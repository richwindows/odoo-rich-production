/** @odoo-module **/

// -*- coding: utf-8 -*-
// Rich Production cutting list preview
import { Component, useState, onWillStart, onMounted } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { download } from "@web/core/network/download";
import { processWindowData } from "./window_calculations/xo_ox_window";
import { _t } from "@web/core/l10n/translation";

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
            reportId: false,
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
            welderDataList: [], // 添加Sash Welder数据列表
            decaData: [], // 添加DECA数据数组
            loadingState: 'loading', // 'loading', 'loaded', 'error'
            errorMessage: '',
            expandedPanels: {}, // 跟踪展开/折叠的面板
            windowCalculationResults: [], // 存储批量保存的计算结果
            calculationSaveStatus: 'unsaved', // 'unsaved', 'saving', 'saved', 'error'
            calculationSaveMessage: '' // 保存状态消息
        });
        
        this.orm = useService("orm");
        this.actionService = useService("action");
        this.notificationService = useService("notification");
        
        // 从导入的模块获取窗口计算函数
        this.XOOXWindowCalculator = { processWindowData };
        
        // 绑定事件处理方法
        this.onDownloadFrameCSV = this.downloadFrameDataCSV.bind(this);
        this.onDownloadSashCSV = this.downloadSashDataCSV.bind(this);
        this.onDownloadScreenCSV = this.downloadScreenDataCSV.bind(this);
        this.onDownloadPartsCSV = this.downloadPartsDataCSV.bind(this);
        this.onDownloadGlassCSV = this.downloadGlassDataCSV.bind(this);
        this.onDownloadGridCSV = this.downloadGridDataCSV.bind(this);
        this.onDownloadWelderCSV = this.downloadWelderDataCSV.bind(this);
        this.onDownloadDecaCSV = this.downloadDecaDataCSV.bind(this); // 添加DECA数据导出
        this.onSaveCalculations = this.saveCalculations.bind(this);
        
        // 材料配置
        this.materialsConfig = {
            "materials": [
                { "id": "HMST82-01", "length": 233 },
                { "id": "HMST82-02B", "length": 233 },
                { "id": "HMST82-03", "length": 233 },
                { "id": "HMST82-04", "length": 233 },
                { "id": "HMST82-05", "length": 233 },
                { "id": "HMST82-10", "length": 233 },
                { "id": "HMST130-01", "length": 181 },
                { "id": "HMST130-01B", "length": 181 },
                { "id": "HMST130-02", "length": 181 }
            ]
        };
        
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
                
                // 尝试获取批次的所有计算结果
                if (this.state.batchNumber) {
                    try {
                        console.log("尝试获取批次的所有计算结果");
                        const calculationResults = await this.orm.call(
                            "window.calculation.result",
                            "get_batch_calculation_results",
                            [this.state.batchNumber]
                        );
                        
                        if (calculationResults && calculationResults.length > 0) {
                            console.log("获取到计算结果:", calculationResults);
                            
                            // 将计算结果转换为产品行列表
                            const productLines = calculationResults.map((result, index) => ({
                                id: result.item_id || index + 1,
                                customer: result.customer || '',
                                style: result.style || '',
                                width: result.width || 0,
                                height: result.height || 0,
                                fh: result.fh || '',
                                frame: result.frame || '',
                                glass: result.glass || '',
                                argon: result.argon || false,
                                grid: result.grid || '',
                                color: result.color || '',
                                note: result.note || '',
                                // 将计算结果保存到产品行中，以便后续处理
                                calculationData: result
                            }));
                            
                            if (productLines.length > 0) {
                                this.state.productLines = productLines;
                                this.notificationService.add("成功加载已保存的计算结果", { type: "success" });
                                this.processStoredCalculations();
                                return;
                            }
                        }
                    } catch (error) {
                        console.error("获取计算结果失败:", error);
                    }
                }
                
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
        this.state.welderDataList = []; // 重置焊接器数据
        this.state.decaData = []; // 重置DECA数据

        console.log('开始处理窗户数据，窗户数量:', this.state.productLines.length);
        
        // 创建一个计算结果数组，用于后续批量保存
        const calculationResults = [];

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
                    // 确保calculations对象包含格式化后的frameData
                    if (!calculations.formattedFrame) {
                        calculations.formattedFrame = frameData;
                    }
                }
                
                // Format sash data for display in the sash details table
                const sashData = this.formatSashData(window, calculations);
                console.log(`窗户 #${index+1} 嵌扇数据:`, sashData);
                if (sashData) {
                    this.state.sashData.push(sashData);
                    // 确保calculations对象包含格式化后的sashData
                    if (!calculations.formattedSash) {
                        calculations.formattedSash = sashData;
                    }
                }
                
                // Format screen data for display in the screen table
                const screenData = this.formatScreenData(window, calculations);
                console.log(`窗户 #${index+1} 屏幕数据:`, screenData);
                if (screenData) {
                    this.state.screenData.push(screenData);
                    // 确保calculations对象包含格式化后的screenData
                    if (!calculations.formattedScreen) {
                        calculations.formattedScreen = screenData;
                    }
                }
                
                // Format parts data for display in the parts table
                const partsData = this.formatPartsData(window, calculations);
                console.log(`窗户 #${index+1} 配件数据:`, partsData);
                if (partsData) {
                    this.state.partsData.push(partsData);
                    // 确保calculations对象包含格式化后的partsData
                    if (!calculations.formattedParts) {
                        calculations.formattedParts = partsData;
                    }
                }
                
                // Format glass data for display in the glass table
                const glassData = this.formatGlassData(window, calculations);
                console.log(`窗户 #${index+1} 玻璃数据:`, glassData);
                if (glassData && glassData.length > 0) {
                    this.state.glassData.push(...glassData);
                    // 确保calculations对象包含格式化后的glassData
                    if (!calculations.formattedGlass) {
                        calculations.formattedGlass = glassData;
                    }
                }
                
                // Format grid data for display in the grid table
                const gridData = this.formatGridData(window, calculations);
                console.log(`窗户 #${index+1} 网格数据:`, gridData);
                if (gridData) {
                    this.state.gridData.push(gridData);
                    // 确保calculations对象包含格式化后的gridData
                    if (!calculations.formattedGrid) {
                        calculations.formattedGrid = gridData;
                    }
                }
                
                // 格式化焊接器数据
                const welderData = this.formatWelderData(window, calculations);
                console.log(`窗户 #${index+1} 焊接器数据:`, welderData);
                if (welderData) {
                    this.state.welderDataList.push(welderData);
                    // 确保calculations对象包含格式化后的welderData
                    if (!calculations.formattedWelder) {
                        calculations.formattedWelder = welderData;
                    }
                }
                
                // 格式化DECA数据
                const decaData = await this.formatDecaData(window, calculations);
                console.log(`窗户ID=${index+1} DECA数据:`, decaData);
                if (decaData && decaData.length > 0) {
                    this.state.decaData.push(...decaData);
                    // 确保calculations对象包含格式化后的decaData
                    if (!calculations.formattedDeca) {
                        calculations.formattedDeca = decaData;
                    }
                }
                
                // 将计算结果添加到数组，以便后续批量保存
                if (window.id) {
                    // 添加窗户基本信息
                    calculations.windowInfo = {
                        customer: window.customer || '',
                        style: window.style || '',
                        width: window.width || 0,
                        height: window.height || 0,
                        fh: window.fh || '',
                        frame: window.frame || '',
                        glass: window.glass || '',
                        argon: window.argon || false,
                        grid: window.grid || '',
                        grid_size: window.grid_size || '',
                        color: window.color || '',
                        note: window.note || '',
                        item_id: window.id
                    };
                    
                    // 添加格式化的窗户信息，保持与其他formatted*对象一致的格式
                    calculations.formattedWindowInfo = {
                        batch: this.state.batchNumber,
                        customer: window.customer || '',
                        style: window.style || '',
                        width: window.width || 0,
                        height: window.height || 0,
                        fh: window.fh || '',
                        id: window.id,
                        frame: window.frame || '',
                        glass: window.glass || '',
                        argon: window.argon || false,
                        grid: window.grid || '',
                        grid_size: window.grid_size || '',
                        color: window.color || '',
                        note: window.note || ''
                    };
                    
                    calculationResults.push({
                        windowId: window.id,
                        calculations: calculations
                    });
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
        
        // 所有数据处理完成后，批量保存计算结果
        if (calculationResults.length > 0 && this.state.productionId) {
            try {
                console.log('开始批量保存计算结果...');
                console.log('计算结果:', calculationResults);
                
                // 逐个保存每个窗户的计算结果
                for (const result of calculationResults) {
                    try {
                        // 只保存格式化后的数据，减少存储量
                        const calculationData = {
                            // 保存格式化后的数据
                            formattedFrame: result.calculations.formattedFrame || {},
                            formattedSash: result.calculations.formattedSash || {},
                            formattedScreen: result.calculations.formattedScreen || {},
                            formattedParts: result.calculations.formattedParts || {},
                            formattedGlass: result.calculations.formattedGlass || [],
                            formattedGrid: result.calculations.formattedGrid || {},
                            formattedWindowInfo: result.calculations.formattedWindowInfo || {},
                            
                            // 保留必要的框架类型信息
                            frameType: result.calculations.frameType || ''
                        };
                        
                        console.log(`准备保存窗户ID=${result.windowId}的格式化计算结果:`, calculationData);
                        
                        const saveResult = await this.orm.call(
                            'window.calculation.result',
                            'save_calculation',
                            [result.windowId, calculationData]
                        );
                        console.log(`窗户ID=${result.windowId} 计算结果保存成功:`, saveResult);
                    } catch (saveError) {
                        console.error(`窗户ID=${result.windowId} 计算结果保存失败:`, saveError);
                    }
                }
                
                console.log('所有计算结果保存完成');
                this.notificationService.add("数据处理并保存完成", { type: "success" });
            } catch (batchSaveError) {
                console.error('批量保存计算结果失败:', batchSaveError);
                this.notificationService.add("部分数据保存失败", { type: "warning" });
            }
        }
        
        // 输出最终结果
        // console.log('数据处理完成，最终结果:');
        // console.log('- 框架数据:', this.state.frameData.length, '条', this.state.frameData);
        // console.log('- 嵌扇数据:', this.state.sashData.length, '条', this.state.sashData);
        // console.log('- 屏幕数据:', this.state.screenData.length, '条', this.state.screenData);
        // console.log('- 配件数据:', this.state.partsData.length, '条', this.state.partsData);
        // console.log('- 玻璃数据:', this.state.glassData.length, '条', this.state.glassData);
        // console.log('- 网格数据:', this.state.gridData.length, '条', this.state.gridData);
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
        if (!this.state.reportId) {
            // If no report ID, create a report first
            try {
                // 使用orm服务调用controller方法
                const result = await this.orm.call(
                    'rich_production.cutting.list.report',
                    'create_for_production', 
                    [this.state.productionId]
                );
                
                if (result) {
                    this.state.reportId = result;
                } else {
                    // Show error message
                    this.notificationService.add(_t("Failed to create report. Please try again."), {
                        type: 'danger',
                    });
                    return;
                }
            } catch (error) {
                this.notificationService.add(_t("Error creating report: ") + (error.message || 'Unknown error'), {
                    type: 'danger',
                });
                return;
            }
        }
        
        // Redirect to download URL
        const downloadUrl = `/rich_production/download_excel/${this.state.reportId}`;
        window.location.href = downloadUrl;
    }
    
    /**
     * Download a single sheet from the cutting list report
     * @param {String} sheetName - Name of the sheet to download (general_info, sash_welder, etc.)
     */
    async downloadSingleSheet(sheetName) {
        if (!this.state.reportId) {
            // If no report ID, create a report first
            try {
                // 使用orm服务调用controller方法
                const result = await this.orm.call(
                    'rich_production.cutting.list.report',
                    'create_for_production', 
                    [this.state.productionId]
                );
                
                if (result) {
                    this.state.reportId = result;
                } else {
                    // Show error message
                    this.notificationService.add(_t("Failed to create report. Please try again."), {
                        type: 'danger',
                    });
                    return;
                }
            } catch (error) {
                this.notificationService.add(_t("Error creating report: ") + (error.message || 'Unknown error'), {
                    type: 'danger',
                });
                return;
            }
        }
        
        // Redirect to download URL for the specific sheet
        const downloadUrl = `/rich_production/download_sheet/${this.state.reportId}/${sheetName}`;
        window.location.href = downloadUrl;
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

    async processStoredCalculations() {
        // 重置所有数据数组
        this.state.frameData = [];
        this.state.sashData = [];
        this.state.screenData = [];
        this.state.partsData = [];
        this.state.glassData = [];
        this.state.gridData = [];
        this.state.welderDataList = []; // 重置焊接器数据列表
        this.state.decaData = []; // 重置DECA数据列表

        console.log('处理已保存的计算结果，窗户数量:', this.state.productLines.length);
        
        // 处理每个窗户的计算结果
        for (let index = 0; index < this.state.productLines.length; index++) {
            const window = this.state.productLines[index];
            const calculationData = window.calculationData;
            
            if (!calculationData) {
                console.warn(`窗户 #${index+1} 没有计算数据`);
                continue;
            }
            
            try {
                console.log(`处理窗户 #${index+1} 的已保存计算结果:`, calculationData);
                
                // 处理窗口基本信息
                window.formattedWindowInfo = calculationData.formattedWindowInfo || {
                    batch: this.state.batchNumber,
                    customer: window.customer || '',
                    style: window.style || '',
                    width: window.width || 0,
                    height: window.height || 0,
                    fh: window.fh || '',
                    id: window.id,
                    frame: window.frame || '',
                    glass: window.glass || '',
                    argon: window.argon || false,
                    grid: window.grid || '',
                    grid_size: window.grid_size || '',
                    color: window.color || '',
                    note: window.note || ''
                };
                
                // 处理框架数据
                if (calculationData.frame && calculationData.frame.length > 0) {
                    const frameData = calculationData.frame[0]; // 使用第一条记录
                    if (frameData) {
                        this.state.frameData.push({
                            ...frameData,
                            id: window.id,
                            batchNumber: this.state.batchNumber
                        });
                    }
                }
                
                // 处理嵌扇数据
                if (calculationData.sash && calculationData.sash.length > 0) {
                    const sashData = calculationData.sash[0]; // 使用第一条记录
                    if (sashData) {
                        this.state.sashData.push({
                            ...sashData,
                            id: window.id,
                            batchNumber: this.state.batchNumber
                        });
                    }
                }
                
                // 处理屏幕数据
                if (calculationData.screen && calculationData.screen.length > 0) {
                    const screenData = calculationData.screen[0]; // 使用第一条记录
                    if (screenData) {
                        this.state.screenData.push({
                            ...screenData,
                            id: window.id,
                            batchNumber: this.state.batchNumber
                        });
                    }
                }
                
                // 处理零部件数据
                if (calculationData.parts && calculationData.parts.length > 0) {
                    const partsData = calculationData.parts[0]; // 使用第一条记录
                    if (partsData) {
                        this.state.partsData.push({
                            ...partsData,
                            id: window.id,
                            batchNumber: this.state.batchNumber
                        });
                    }
                }
                
                // 处理玻璃数据
                if (calculationData.glass && calculationData.glass.length > 0) {
                    const glassItems = calculationData.glass.map(item => ({
                        ...item,
                        id: window.id,
                        batchNumber: this.state.batchNumber
                    }));
                    
                    if (glassItems.length > 0) {
                        this.state.glassData.push(...glassItems);
                    }
                }
                
                // 处理网格数据
                if (calculationData.grid && calculationData.grid.length > 0) {
                    const gridData = calculationData.grid[0]; // 使用第一条记录
                    if (gridData) {
                        this.state.gridData.push({
                            ...gridData,
                            id: window.id,
                            batchNumber: this.state.batchNumber
                        });
                    }
                }
                
                // 处理焊接器数据
                if (calculationData.welder && calculationData.welder.length > 0) {
                    const welderData = calculationData.welder[0]; // 使用第一条记录
                    if (welderData) {
                        this.state.welderDataList.push({
                            ...welderData,
                            id: window.id,
                            batchNumber: this.state.batchNumber
                        });
                    }
                }
                
                // 处理DECA数据
                if (calculationData.deca && calculationData.deca.length > 0) {
                    const decaItems = calculationData.deca.map(item => ({
                        ...item,
                        id: window.id,
                        batchNumber: this.state.batchNumber
                    }));
                    
                    if (decaItems.length > 0) {
                        this.state.decaData.push(...decaItems);
                    }
                } else {
                    // 如果没有已保存的DECA数据，尝试重新生成
                    try {
                        // 使用框架数据重新生成DECA数据
                        if (calculationData.frame && calculationData.frame.length > 0) {
                            const decaData = await this.formatDecaData(window, {
                                frame: calculationData.frame,
                                frameType: window.frame
                            });
                            
                            if (decaData && decaData.length > 0) {
                                this.state.decaData.push(...decaData);
                                console.log(`为窗户 #${index+1} 重新生成了 ${decaData.length} 条DECA记录`);
                            }
                        }
                    } catch (decaError) {
                        console.error(`为窗户 #${index+1} 重新生成DECA数据时出错:`, decaError);
                    }
                }
            } catch (error) {
                console.error(`处理窗户 #${index+1} 的已保存计算结果时出错:`, error);
            }
        }
        
        // 对Glass数据按ID和lineNumber排序
        if (this.state.glassData && this.state.glassData.length > 0) {
            // 先按ID排序，再按lineNumber排序
            this.state.glassData.sort((a, b) => {
                if (a.id !== b.id) {
                    return a.id - b.id;
                }
                return (a.lineNumber || 0) - (b.lineNumber || 0);
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
        
        this.state.loading = false;
    }

    /**
     * 格式化焊接器数据用于表格显示
     * @param {Object} window - 窗户数据
     * @param {Object} calculations - 计算结果
     * @returns {Object} 表格显示格式的焊接器数据
     */
    formatWelderData(window, calculations) {
        try {
            // 检查窗户是否有必要的信息
            if (!window.width || !window.height) {
                return null;
            }
            
            // 获取嵌扇数据
            const sashData = calculations.sash || [];
            let width = '';
            let height = '';
            
            // 从嵌扇数据中提取尺寸
            if (Array.isArray(sashData) && sashData.length > 0) {
                // 嵌扇宽度通常是水平方向('--')的长度
                const sashWidthItem = sashData.find(item => 
                    (item.material === '82-03' || item.material === '82-04') && 
                    item.position === '--');
                
                // 嵌扇高度通常是垂直方向('|')的长度
                const sashHeightItem = sashData.find(item => 
                    (item.material === '82-03' || item.material === '82-04') && 
                    item.position === '|');
                
                if (sashWidthItem) {
                    width = sashWidthItem.length;
                }
                
                if (sashHeightItem) {
                    height = sashHeightItem.length;
                }
            }
            
            // 如果无法从计算中获取嵌扇尺寸，则尝试从直接属性获取
            if (!width && calculations.sashWidth) {
                width = calculations.sashWidth;
            }
            
            if (!height && calculations.sashHeight) {
                height = calculations.sashHeight;
            }
            
            // 如果仍然没有数据，可能这个窗户没有嵌扇
            if (!width && !height) {
                return null;
            }
            
            // 计算毫米尺寸并减去6mm，然后转为英寸
            // 假设原始值是英寸，1英寸 = 25.4毫米
            let sashWidth = '';
            let sashHeight = '';
            
            if (width) {
                // 转为毫米，减去6mm，再转回英寸
                const widthInMm = parseFloat(width) * 25.4;
                const adjustedWidthInMm = widthInMm - 6;
                sashWidth = (adjustedWidthInMm / 25.4).toFixed(2);
            }
            
            if (height) {
                // 转为毫米，减去6mm，再转回英寸
                const heightInMm = parseFloat(height) * 25.4;
                const adjustedHeightInMm = heightInMm - 6;
                sashHeight = (adjustedHeightInMm / 25.4).toFixed(2);
            }
            
            // 计算嵌扇数量 - 根据样式中X的数量
            const style = window.style || '';
            const pieces = (style.match(/X/gi) || []).length || 1;
            
            // 创建焊接器数据对象
            return {
                id: window.id,
                customer: window.customer || '',
                style: window.style || '',
                width: width, // 原始嵌扇宽度
                height: height, // 原始嵌扇高度
                sashWidth: sashWidth, // 调整后的宽度 (mm - 6mm 转为英寸)
                sashHeight: sashHeight, // 调整后的高度 (mm - 6mm 转为英寸)
                pieces: pieces, // 根据style中X的数量
                color: window.color || ''
            };
        } catch (error) {
            console.error('Error formatting welder data:', error);
            return null;
        }
    }

    /**
     * 获取材料长度
     * @param {String} materialName - 材料名称
     * @returns {Promise<Number>} 材料长度
     */
    async getMaterialLength(materialName) {
        try {
            // 首先尝试从API获取材料长度
            const response = await fetch(`/api/material/length?material_id=${encodeURIComponent(materialName)}`);
            const data = await response.json();
            
            if (data.success && data.length) {
                return data.length;
            }
            
            // 如果API不可用，尝试从materials.json获取
            try {
                const configResponse = await fetch('/config/materials.json');
                const configData = await configResponse.json();
                const material = configData.materials.find(m => materialName.startsWith(m.id));
                if (material) {
                    return material.length;
                }
            } catch (configError) {
                console.warn('无法从配置文件获取材料数据:', configError);
            }
            
            // 回退到内存中的配置
            const material = this.materialsConfig.materials.find(m => materialName.startsWith(m.id));
            if (!material) {
                throw new Error(`未找到材料 ${materialName} 的配置`);
            }
            return material.length;
        } catch (error) {
            console.error('获取材料长度失败:', error);
            throw error; // 重新抛出错误以匹配原函数行为
        }
    }

    /**
     * 优化切割组
     * @param {Array} pieces - 需要切割的片段数组
     * @param {Number} materialLength - 材料长度
     * @returns {Array} 优化后的切割组
     */
    optimizeCuttingGroups(pieces, materialLength) {
        // 转换属性名为大写格式，以匹配原始函数
        const formattedPieces = pieces.map(piece => ({
            ...piece,
            Qty: piece.qty,
            Length: piece.length,
            Position: piece.position,
            Material: piece.material
        }));
        
        // 按数量分组
        const qtyGroups = formattedPieces.reduce((acc, piece) => {
            const qty = piece.Qty;
            if (!acc[qty]) acc[qty] = [];
            acc[qty].push(piece);
            return acc;
        }, {});

        let groupId = 1;
        const optimizedGroups = [];

        // 对每个数量组分别优化
        Object.entries(qtyGroups).forEach(([qty, pieces]) => {
            // 按长度从大到小排序
            const sortedPieces = [...pieces].sort((a, b) => b.Length - a.Length);
            let remainingPieces = [...sortedPieces];
            
            while (remainingPieces.length > 0) {
                let currentGroup = [];
                let currentLength = 0;
                let i = 0;

                const maxAllowedLength = materialLength - 6; // 实际可用的最大长度

                while (i < remainingPieces.length) {
                    const piece = remainingPieces[i];
                    const pieceLength = piece.Length;
                    const cutLoss = currentGroup.length > 0 ? 4 : 0;
                    const newTotalLength = currentLength + pieceLength + cutLoss;

                    // 确保实际用料不超过材料长度-6
                    if (newTotalLength <= maxAllowedLength) {
                        currentGroup.push({
                            ...piece,
                            'Cutting ID': groupId,
                            'Pieces ID': currentGroup.length + 1  // 为每个片段添加序号，从1开始
                        });
                        currentLength = newTotalLength;
                        remainingPieces.splice(i, 1);
                        i = 0; // 重新从头开始查找可能放入的小片段
                        continue;
                    }
                    i++;
                }

                // 如果当前组有内容，计算组的总长度和损耗
                if (currentGroup.length > 0) {
                    const totalLength = currentGroup.reduce((sum, p) => sum + p.Length, 0); // 所有片段的总长度
                    const cutLoss = currentGroup.length > 1 ? 4 * (currentGroup.length - 1) : 0; // 切割损耗
                    const actualLength = totalLength + cutLoss; // 实际用料 = 总长度 + 切割损耗
                    const remainingLength = materialLength - actualLength; // 剩余长度
                    const usableRemainingLength = remainingLength - 6; // 可用长度 = 剩余长度 - 端部损耗

                    // 更新组中每个片段的信息
                    currentGroup.forEach(piece => {
                        piece.actualLength = actualLength;
                        piece.remainingLength = remainingLength;
                        piece.usableRemainingLength = usableRemainingLength;
                        piece.cutCount = currentGroup.length;
                        piece.cutLoss = cutLoss;
                    });

                    optimizedGroups.push(...currentGroup);
                    groupId++;
                }
            }
        });

        return optimizedGroups;
    }

    /**
     * 格式化DECA数据用于表格显示
     * @param {Object} window - 窗户数据
     * @param {Object} calculations - 计算结果
     * @returns {Promise<Array>} 表格显示格式的DECA数据数组
     */
    async formatDecaData(window, calculations) {
        try {
            // 获取框架数据
            const frameList = calculations.frame || [];
            if (!Array.isArray(frameList) || frameList.length === 0) {
                console.warn(`窗户ID=${window.id} frame数组为空或无效`);
                return [];
            }

            // 准备优化前的数据
            const piecesToOptimize = frameList.map(item => {
                const { material, position, length, qty } = item;
                
                if (!material || !position || !length) {
                    console.warn(`窗户ID=${window.id} 框架元素数据不完整:`, item);
                    return null;
                }
                
                // 确定位置描述
                let positionDesc = '';
                if (position === '--') {
                    positionDesc = 'TOP+BOTTOM';
                } else if (position === '|') {
                    positionDesc = 'LEFT+RIGHT';
                } else {
                    positionDesc = position;
                }
                
                return {
                    material,
                    position: positionDesc,
                    length,
                    qty: qty || 1,
                    orderItem: window.id,
                    style: window.style || '',
                    frame: window.frame || calculations.frameType || '',
                    productSize: `${window.width}x${window.height}`,
                    color: window.color || '',
                    grid: window.grid || '',
                    glass: window.glass || '',
                    argon: window.argon ? 'Yes' : 'No',
                    customer: window.customer || '',
                    note: window.note || ''
                };
            }).filter(item => item !== null);
            
            // 按材料类型分组
            const materialGroups = piecesToOptimize.reduce((acc, piece) => {
                if (!acc[piece.material]) acc[piece.material] = [];
                acc[piece.material].push(piece);
                return acc;
            }, {});
            
            // 存储最终的DECA数据
            const decaDataArray = [];
            
            // 处理每个材料组
            for (const [material, pieces] of Object.entries(materialGroups)) {
                // 获取材料长度 - 使用异步方法需要await
                const materialLength = await this.getMaterialLength(material).catch(() => 233); // 出错时使用默认值
                
                // 优化切割组
                const optimizedPieces = this.optimizeCuttingGroups(pieces, materialLength);
                
                // 创建DECA数据对象
                optimizedPieces.forEach(piece => {
                    const decaData = {
                        batchNo: this.state.batchNumber, // Batch No
                        orderNo: this.state.batchNumber, // Order No 使用批次号
                        orderItem: piece.orderItem, // Order Item
                        materialName: piece.material, // Material Name
                        cuttingID: piece['Cutting ID'], // Cutting ID - 使用原始属性名
                        piecesID: piece['Pieces ID'], // Pieces ID - 使用原始属性名
                        length: piece.Length || piece.length, // Length
                        angles: '90/90', // Angles (默认为90/90)
                        qty: piece.Qty || piece.qty, // Qty
                        binNo: piece['Cutting ID'], // Bin No 使用切割组ID
                        cartNo: piece['Cutting ID'], // Cart No 使用切割组ID
                        position: piece.Position || piece.position, // Position
                        labelPrint: '', // Label Print
                        barcodeNo: `${this.state.batchNumber}-${piece.orderItem}-${piece.material}-${piece['Cutting ID']}-${piece['Pieces ID']}`, // Barcode No
                        poNo: '', // PO No
                        style: piece.style, // Style
                        frame: piece.frame, // Frame
                        productSize: piece.productSize, // Product Size
                        color: piece.color, // Color
                        grid: piece.grid, // Grid
                        glass: piece.glass, // Glass
                        argon: piece.argon, // Argon
                        painting: '', // Painting
                        productDBalance: '', // Product D Balance
                        shift: '', // Shift
                        shipDate: '', // Ship date
                        note: piece.note, // Note
                        customer: piece.customer, // Customer
                        
                        // 附加信息用于排序和展示
                        actualLength: piece.actualLength,
                        remainingLength: piece.remainingLength,
                        usableRemainingLength: piece.usableRemainingLength,
                        cutCount: piece.cutCount,
                        cutLoss: piece.cutLoss
                    };
                    
                    decaDataArray.push(decaData);
                });
            }
            
            console.log(`窗户ID=${window.id} 生成了 ${decaDataArray.length} 条DECA记录`);
            return decaDataArray;
        } catch (error) {
            console.error('Error formatting DECA data:', error);
            return [];
        }
    }

    getWelderDataTable() {
        if (!(this.state.welderDataList || []).length) {
            return [];
        }
        
        // Sort by customer and style
        return [...this.state.welderDataList].sort((a, b) => {
            if (a.customer !== b.customer) {
                return a.customer.localeCompare(b.customer);
            }
            return a.style.localeCompare(b.style);
        });
    }

    /**
     * 获取DECA数据表格
     * @returns {Array} 格式化后的DECA数据数组
     */
    getDecaDataTable() {
        if (!this.state.decaData || !this.state.decaData.length) {
            return [];
        }
        
        // 按照批次号、材料名、切割ID和片段ID排序
        return [...this.state.decaData].sort((a, b) => {
            if (a.batchNo !== b.batchNo) {
                return a.batchNo.localeCompare(b.batchNo);
            }
            if (a.materialName !== b.materialName) {
                return a.materialName.localeCompare(b.materialName);
            }
            if (a.cuttingID !== b.cuttingID) {
                return a.cuttingID - b.cuttingID;
            }
            return a.piecesID - b.piecesID;
        });
    }

    /**
     * 通用CSV下载方法
     * @param {Array} headers - CSV表头数组
     * @param {Array} rows - CSV数据行数组，每行是一个数组
     * @param {String} filename - 下载的文件名
     */
    downloadCSV(headers, rows, filename) {
        if (!headers || !rows) {
            console.warn('无效的CSV数据');
            return;
        }
        
        // 构建CSV内容
        const csvContent = [
            // 添加表头
            headers.join(','),
            // 添加数据行
            ...rows.map(row => 
                row.map(cell => {
                    // 处理特殊字符，如逗号、引号、换行符等
                    if (cell === null || cell === undefined) {
                        return '';
                    }
                    
                    const cellStr = String(cell);
                    // 如果包含逗号、引号或换行符，则用引号包裹并处理内部引号
                    if (cellStr.indexOf(',') !== -1 || cellStr.indexOf('"') !== -1 || 
                        cellStr.indexOf('\n') !== -1 || cellStr.indexOf('\r') !== -1) {
                        return '"' + cellStr.replace(/"/g, '""') + '"';
                    }
                    return cellStr;
                }).join(',')
            )
        ].join('\n');
        
        // 创建Blob对象
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        
        // 使用download服务下载文件
        const url = URL.createObjectURL(blob);
        
        // 创建临时链接并触发下载
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        
        // 清理
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * 下载焊接器数据为CSV
     */
    downloadWelderDataCSV() {
        const data = this.getWelderDataTable();
        if (!data || data.length === 0) {
            console.warn('没有焊接器数据可下载');
            return;
        }
        
        // 定义CSV表头
        const headers = [
            '序号', 
            '客户', 
            '窗户样式', 
            '嵌扇宽度', 
            '嵌扇高度', 
            '调整后宽度', 
            '调整后高度', 
            '数量', 
            '颜色'
        ];
        
        // 映射数据行
        const rows = data.map(item => [
            item.id, 
            item.customer, 
            item.style, 
            item.width, 
            item.height, 
            item.sashWidth, 
            item.sashHeight, 
            item.pieces, 
            item.color
        ]);
        
        // 使用通用的CSV下载方法
        this.downloadCSV(headers, rows, `焊接器数据_${this.state.batchNumber}.csv`);
    }

    /**
     * 下载DECA数据为CSV
     */
    downloadDecaDataCSV() {
        const data = this.getDecaDataTable();
        if (!data || data.length === 0) {
            console.warn('没有DECA数据可下载');
            return;
        }
        
        // 定义CSV表头 - 完整的DECA数据字段
        const headers = [
            'Batch No', 
            'Order No', 
            'Order Item', 
            'Material Name', 
            'Cutting ID', 
            'Pieces ID', 
            'Length', 
            'Angles', 
            'Qty', 
            'Bin No',
            'Cart No',
            'Position',
            'Label Print',
            'Barcode No',
            'PO No',
            'Style',
            'Frame',
            'Product Size',
            'Color',
            'Grid',
            'Glass',
            'Argon',
            'Painting',
            'Product D Balance',
            'Shift',
            'Ship date',
            'Note',
            'Customer'
        ];
        
        // 映射数据行
        const rows = data.map(item => [
            item.batchNo,
            item.orderNo,
            item.orderItem,
            item.materialName,
            item.cuttingID,
            item.piecesID,
            item.length,
            item.angles,
            item.qty,
            item.binNo,
            item.cartNo,
            item.position,
            item.labelPrint,
            item.barcodeNo,
            item.poNo,
            item.style,
            item.frame,
            item.productSize,
            item.color,
            item.grid,
            item.glass,
            item.argon,
            item.painting,
            item.productDBalance,
            item.shift,
            item.shipDate,
            item.note,
            item.customer
        ]);
        
        // 使用通用的CSV下载方法
        this.downloadCSV(headers, rows, `DECA数据_${this.state.batchNumber}.csv`);
    }

    /**
     * 下载框架数据为CSV
     */
    downloadFrameDataCSV() {
        if (!this.state.frameData || this.state.frameData.length === 0) {
            console.warn('没有框架数据可下载');
            this.notificationService.add("没有框架数据可下载", { type: "warning" });
            return;
        }
        
        // 定义CSV表头
        const headers = [
            '批次',
            '样式',
            '82-02B--',
            '数量',
            '82-02B|',
            '数量',
            '82-10--',
            '数量',
            '82-10|',
            '数量',
            '82-01--',
            '数量',
            '82-01|',
            '数量',
            '颜色',
            'ID'
        ];
        
        // 映射数据行
        const rows = this.state.frameData.map(row => [
            row.batch || '',
            row.style || '',
            row['82-02B--'] || 0,
            row['82-02BPcs'] || 0,
            row['82-02B|'] || 0,
            row['82-02B|Pcs'] || 0,
            row['82-10--'] || 0,
            row['82-10Pcs'] || 0,
            row['82-10|'] || 0,
            row['82-10|Pcs'] || 0,
            row['82-01--'] || 0,
            row['82-01Pcs'] || 0,
            row['82-01|'] || 0,
            row['82-01|Pcs'] || 0,
            row.color || '',
            row.id || ''
        ]);
        
        // 使用通用的CSV下载方法
        this.downloadCSV(headers, rows, `框架数据_${this.state.batchNumber}.csv`);
    }

    /**
     * 下载嵌扇数据为CSV
     */
    downloadSashDataCSV() {
        if (!this.state.sashData || this.state.sashData.length === 0) {
            console.warn('没有嵌扇数据可下载');
            this.notificationService.add("没有嵌扇数据可下载", { type: "warning" });
            return;
        }
        
        // 定义CSV表头
        const headers = [
            '批次',
            '样式',
            '82-03--',
            '数量',
            '82-03|',
            '数量',
            '82-05|',
            '数量',
            '82-04--',
            '数量',
            '82-04|',
            '数量',
            '颜色',
            'ID'
        ];
        
        // 映射数据行
        const rows = this.state.sashData.map(row => [
            row.batch || '',
            row.style || '',
            row['82-03--'] || 0,
            row['82-03Pcs'] || 0,
            row['82-03|'] || 0,
            row['82-03|Pcs'] || 0,
            row['82-05|'] || 0,
            row['82-05|Pcs'] || 0,
            row['82-04--'] || 0,
            row['82-04Pcs'] || 0,
            row['82-04|'] || 0,
            row['82-04|Pcs'] || 0,
            row.color || '',
            row.id || ''
        ]);
        
        // 使用通用的CSV下载方法
        this.downloadCSV(headers, rows, `嵌扇数据_${this.state.batchNumber}.csv`);
    }

    /**
     * 下载屏幕数据为CSV
     */
    downloadScreenDataCSV() {
        if (!this.state.screenData || this.state.screenData.length === 0) {
            console.warn('没有屏幕数据可下载');
            this.notificationService.add("没有屏幕数据可下载", { type: "warning" });
            return;
        }
        
        // 定义CSV表头
        const headers = [
            '客户',
            'ID',
            '样式',
            '屏幕宽度',
            '数量',
            '屏幕高度',
            '数量',
            '颜色',
            'ID'
        ];
        
        // 映射数据行
        const rows = this.state.screenData.map(row => [
            row.customer || '',
            row.lineId || '',
            row.style || '',
            row.screenw || 0,
            row.screenwPcs || 0,
            row.screenh || 0,
            row.screenhPcs || 0,
            row.color || '',
            row.id || ''
        ]);
        
        // 使用通用的CSV下载方法
        this.downloadCSV(headers, rows, `屏幕数据_${this.state.batchNumber}.csv`);
    }

    /**
     * 下载配件数据为CSV
     */
    downloadPartsDataCSV() {
        if (!this.state.partsData || this.state.partsData.length === 0) {
            console.warn('没有配件数据可下载');
            this.notificationService.add("没有配件数据可下载", { type: "warning" });
            return;
        }
        
        // 定义CSV表头
        const headers = [
            '批次',
            'ID',
            '样式',
            '窗格条',
            '中心铝',
            '把手铝',
            '数量',
            '轨道',
            '水平盖板',
            '垂直盖板',
            '大窗格条',
            '数量',
            '第二大窗格条',
            '数量',
            '斜度',
            '颜色',
            'ID'
        ];
        
        // 映射数据行
        const rows = this.state.partsData.map(row => [
            row.batch || '',
            row.lineId || '',
            row.style || '',
            row.mullion || '',
            row.centerAlu || '',
            row.handleAlu || '',
            row.handlePcs || 0,
            row.track || '',
            row.coverH || '',
            row.coverV || '',
            row.largeMullion || '',
            row.largeMullionPcs || 0,
            row.largeMullion2 || '',
            row.largeMullion2Pcs || 0,
            row.slop || '',
            row.color || '',
            row.id || ''
        ]);
        
        // 使用通用的CSV下载方法
        this.downloadCSV(headers, rows, `配件数据_${this.state.batchNumber}.csv`);
    }

    /**
     * 下载玻璃数据为CSV
     */
    downloadGlassDataCSV() {
        if (!this.state.glassData || this.state.glassData.length === 0) {
            console.warn('没有玻璃数据可下载');
            this.notificationService.add("没有玻璃数据可下载", { type: "warning" });
            return;
        }
        
        // 定义CSV表头
        const headers = [
            '客户',
            '样式',
            '宽度',
            '高度',
            'FH',
            'ID',
            '行号',
            '数量',
            '玻璃类型',
            '钢化',
            '厚度',
            '玻璃宽度',
            '玻璃高度',
            '网格',
            '氩气',
            'ID'
        ];
        
        // 映射数据行 - 注意玻璃数据可能需要特殊处理，因为它可能有多行
        const rows = this.state.glassData.map(row => [
            row.customer || '',
            row.style || '',
            row.width || 0,
            row.height || 0,
            row.fh || '',
            row.id || '',
            row.lineNumber || '',
            row.quantity || 0,
            row.glassType || '',
            row.tempered || '',
            row.thickness || '',
            row.glassWidth || 0,
            row.glassHeight || 0,
            row.grid || '',
            row.argon || '',
            row.id || ''
        ]);
        
        // 使用通用的CSV下载方法
        this.downloadCSV(headers, rows, `玻璃数据_${this.state.batchNumber}.csv`);
    }

    /**
     * 下载网格数据为CSV
     */
    downloadGridDataCSV() {
        if (!this.state.gridData || this.state.gridData.length === 0) {
            console.warn('没有网格数据可下载');
            this.notificationService.add("没有网格数据可下载", { type: "warning" });
            return;
        }
        
        // 定义CSV表头
        const headers = [
            '批次',
            '样式',
            '网格样式',
            'W1',
            '数量',
            '一刀',
            'H1',
            '数量',
            '一刀',
            'W2',
            '数量',
            '一刀',
            'H2',
            '数量',
            '一刀',
            'ID',
            '备注',
            '颜色'
        ];
        
        // 映射数据行
        const rows = this.state.gridData.map(row => [
            row.batch || '',
            row.style || '',
            row.gridStyle || '',
            row.w1 || 0,
            row.w1Pcs || 0,
            row.w1Cut || false,
            row.h1 || 0,
            row.h1Pcs || 0,
            row.h1Cut || false,
            row.w2 || 0,
            row.w2Pcs || 0,
            row.w2Cut || false,
            row.h2 || 0,
            row.h2Pcs || 0,
            row.h2Cut || false,
            row.id || '',
            row.note || '',
            row.color || ''
        ]);
        
        // 使用通用的CSV下载方法
        this.downloadCSV(headers, rows, `网格数据_${this.state.batchNumber}.csv`);
    }

    /**
     * 保存计算结果
     */
    async saveCalculations() {
        // 检查是否有计算结果
        if (!this.state.windowCalculationResults || this.state.windowCalculationResults.length === 0) {
            console.warn('没有计算结果可保存');
            this.notificationService.add("没有计算结果可保存", { type: "warning" });
            return;
        }
        
        this.state.calculationSaveStatus = 'saving';
        this.state.calculationSaveMessage = '正在保存计算结果...';
        
        try {
            // 使用orm调用后端方法保存计算结果
            const result = await this.orm.call(
                'window.calculation.result',
                'save_multiple_calculations',
                [this.state.windowCalculationResults]
            );
            
            if (result && result.success) {
                this.state.calculationSaveStatus = 'saved';
                this.state.calculationSaveMessage = `保存成功：${result.saved_count} 个计算结果已保存`;
                this.notificationService.add(this.state.calculationSaveMessage, { type: "success" });
            } else {
                this.state.calculationSaveStatus = 'error';
                this.state.calculationSaveMessage = `保存失败：${result.message || '未知错误'}`;
                this.notificationService.add(this.state.calculationSaveMessage, { type: "danger" });
                
                // 显示详细错误信息
                if (result.errors && result.errors.length > 0) {
                    console.error('保存错误详情:', result.errors);
                }
            }
        } catch (error) {
            this.state.calculationSaveStatus = 'error';
            this.state.calculationSaveMessage = `保存出错：${error.message || '未知错误'}`;
            this.notificationService.add(this.state.calculationSaveMessage, { type: "danger" });
            console.error('保存计算结果时出错:', error);
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