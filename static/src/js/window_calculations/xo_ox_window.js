/** @odoo-module **/

import { rpc } from "@web/core/network/rpc";

/**
 * XO/OX Window Style Calculations
 * Contains functions for calculating dimensions for XO and OX style windows
 */

/**
 * Converts imperial measurements to metric (mm)
 * @param {string|number} width - Width in inches
 * @param {string|number} height - Height in inches
 * @returns {Object} Object with metric measurements
 */
function convertToMetric(width, height) {
    // Ensure width and height are numbers
    const numWidth = parseFloat(width);
    const numHeight = parseFloat(height);
    
    // Convert to mm (1 inch = 25.4 mm)
    const widthMm = numWidth * 25.4;
    const heightMm = numHeight * 25.4;
    
    return {
        widthInch: numWidth,
        heightInch: numHeight,
        widthMm,
        heightMm
    };
}

/**
 * 精确舍入到指定小数位数 (模拟Application.Round)
 * @param {number} value - 待舍入的值
 * @param {number} decimals - 小数位数
 * @returns {number} 舍入后的值
 */
function round(value, decimals) {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}

/**
 * 将毫米(mm)转换为英寸(inch)并保留指定小数位
 * @param {number} mm - 毫米值
 * @param {number} decimals - 小数位数，默认为3
 * @returns {number} 转换后的英寸值
 */
function mmToInch(mm, decimals = 3) {
    return round(mm / 25.4, decimals);
}

/**
 * 从服务器获取窗户计算公式
 * @param {string} styleName - 窗户样式名称
 * @param {string} formulaType - 公式类型
 * @returns {Promise<Array>} 公式列表
 */
async function getFormulas(styleName, formulaType) {
    try {
        const formulas = await rpc("/web/dataset/call_kw", {
            model: 'window.calculation.formula',
            method: 'search_read',
            args: [
                [['style_name', '=', styleName], ['formula_type', '=', formulaType]],
                ['step_name', 'formula_string', 'sequence']
            ],
            kwargs: {
                order: 'sequence'
            }
        });
        
        return formulas;
    } catch (error) {
        return [];
    }
}

/**
 * 根据玻璃类型生成玻璃列表数据
 * @param {string} glassType - 玻璃类型
 * @param {number} sashglassw - 玻璃宽度(毫米)
 * @param {number} sashglassh - 玻璃高度(毫米)
 * @param {number} fixedglassw - 固定玻璃宽度(毫米)
 * @param {number} fixedglassh - 固定玻璃高度(毫米)
 * @returns {Array} 玻璃列表
 */
function getGlassList(glassType, sashglassw, sashglassh, fixedglassw, fixedglassh) {
    let glassList = [];
    
    if (glassType === 'Clear/Clear') {
        glassList = [
            {
                line: 1,
                qty: 2,
                glassType: 'clear',
                Tmprd: '',
                Thickness: '3',
                width: parseFloat(sashglassw).toFixed(2),
                height: parseFloat(sashglassh).toFixed(2)
            },  
            {
                line: 2,
                qty: 2,
                glassType: 'clear',
                Tmprd: '',
                Thickness: '3',
                width: parseFloat(fixedglassw).toFixed(2),
                height: parseFloat(fixedglassh).toFixed(2)
            }
        ];
    } else if (glassType === 'Clear/Low-E270') {
        glassList = [
            {
                line: 1,
                qty: 1,
                glassType: 'clear',
                Tmprd: '',
                Thickness: '3',
                width: parseFloat(sashglassw).toFixed(2),
                height: parseFloat(sashglassh).toFixed(2)
            },  
            {
                line: 1,
                qty: 2,
                glassType: 'lowe2',
                Tmprd: '',
                Thickness: '3',
                width: parseFloat(sashglassw).toFixed(2),
                height: parseFloat(sashglassh).toFixed(2)
            },
            {
                line: 2,
                qty: 1,
                glassType: 'clear',
                Tmprd: '',
                Thickness: '3',
                width: parseFloat(fixedglassw).toFixed(2),
                height: parseFloat(fixedglassh).toFixed(2)
            },
            {
                line: 2,
                qty: 1,
                glassType: 'lowe2',
                Tmprd: '',
                Thickness: '3',
                width: parseFloat(fixedglassw).toFixed(2),
                height: parseFloat(fixedglassh).toFixed(2)
            }
        ];
    } else if (glassType === 'Clear/Low-E366') {
        glassList = [
            {
                line: 1,
                qty: 1,
                glassType: 'clear',
                Tmprd: '',
                Thickness: '3',
                width: parseFloat(sashglassw).toFixed(2),
                height: parseFloat(sashglassh).toFixed(2)
            },  
            {
                line: 1,
                qty: 1,
                glassType: 'lowe3',
                Tmprd: '',
                Thickness: '3',
                width: parseFloat(sashglassw).toFixed(2),
                height: parseFloat(sashglassh).toFixed(2)
            },
            {
                line: 2,
                qty: 1,
                glassType: 'clear',
                Tmprd: '',
                Thickness: '3',
                width: parseFloat(fixedglassw).toFixed(2),
                height: parseFloat(fixedglassh).toFixed(2)
            },
            {
                line: 2,
                qty: 1,
                glassType: 'lowe3',
                Tmprd: '',
                Thickness: '3',
                width: parseFloat(fixedglassw).toFixed(2),
                height: parseFloat(fixedglassh).toFixed(2)
            }
        ];
    } else if (glassType === 'OBS/Clear') {
        glassList = [
            {
                line: 1,
                qty: 1,
                glassType: 'clear',
                Tmprd: '',
                Thickness: '3',
                width: parseFloat(sashglassw).toFixed(2),
                height: parseFloat(sashglassh).toFixed(2)
            },  
            {
                line: 1,
                qty: 1,
                glassType: 'OBS',
                Tmprd: '',
                Thickness: '3',
                width: parseFloat(sashglassw).toFixed(2),
                height: parseFloat(sashglassh).toFixed(2)
            },
            {
                line: 2,
                qty: 1,
                glassType: 'clear',
                Tmprd: '',
                Thickness: '3',
                width: parseFloat(fixedglassw).toFixed(2),
                height: parseFloat(fixedglassh).toFixed(2)
            },
            {
                line: 2,
                qty: 1,
                glassType: 'OBS',
                Tmprd: '',
                Thickness: '3',
                width: parseFloat(fixedglassw).toFixed(2),
                height: parseFloat(fixedglassh).toFixed(2)
            }
        ];
    } else if (glassType === 'OBS/Low-E270') {
        glassList = [
            {
                line: 1,
                qty: 1,
                glassType: 'lowe2',
                Tmprd: '',
                Thickness: '3',
                width: parseFloat(sashglassw).toFixed(2),
                height: parseFloat(sashglassh).toFixed(2)
            },  
            {
                line: 1,
                qty: 1,
                glassType: 'OBS',
                Tmprd: '',
                Thickness: '3',
                width: parseFloat(sashglassw).toFixed(2),
                height: parseFloat(sashglassh).toFixed(2)
            },
            {
                line: 2,
                qty: 1,
                glassType: 'lowe2',
                Tmprd: '',
                Thickness: '3',
                width: parseFloat(fixedglassw).toFixed(2),
                height: parseFloat(fixedglassh).toFixed(2)
            },
            {
                line: 2,
                qty: 1,
                glassType: 'OBS',
                Tmprd: '',
                Thickness: '3',
                width: parseFloat(fixedglassw).toFixed(2),
                height: parseFloat(fixedglassh).toFixed(2)
            }
        ];
    } else if (glassType === 'OBS/Low-E366') {
        glassList = [
            {
                line: 1,
                qty: 1,
                glassType: 'lowe3',
                Tmprd: '',
                Thickness: '3',
                width: parseFloat(sashglassw).toFixed(2),
                height: parseFloat(sashglassh).toFixed(2)
            },  
            {
                line: 1,
                qty: 1,
                glassType: 'OBS',
                Tmprd: '',
                Thickness: '3',
                width: parseFloat(sashglassw).toFixed(2),
                height: parseFloat(sashglassh).toFixed(2)
            },
            {
                line: 2,
                qty: 1,
                glassType: 'lowe3',
                Tmprd: '',
                Thickness: '3',
                width: parseFloat(fixedglassw).toFixed(2),
                height: parseFloat(fixedglassh).toFixed(2)
            },
            {
                line: 2,
                qty: 1,
                glassType: 'OBS',
                Tmprd: '',
                Thickness: '3',
                width: parseFloat(fixedglassw).toFixed(2),
                height: parseFloat(fixedglassh).toFixed(2)
            }
        ];
    } else if (glassType === 'Clear/Clear Tempered') {
        glassList = [
            {
                line: 1,
                qty: 2,
                glassType: 'clear',
                Tmprd: 'T',
                Thickness: '3',
                width: parseFloat(sashglassw).toFixed(2),
                height: parseFloat(sashglassh).toFixed(2)
            },  
            {
                line: 2,
                qty: 2,
                glassType: 'clear',
                Tmprd: 'T',
                Thickness: '3',
                width: parseFloat(fixedglassw).toFixed(2),
                height: parseFloat(fixedglassh).toFixed(2)
            }
        ];
    } else if (glassType === 'Clear/Low-E270 Tempered') {
        glassList = [
            {
                line: 1,
                qty: 1,
                glassType: 'clear',
                Tmprd: 'T',
                Thickness: '3',
                width: parseFloat(sashglassw).toFixed(2),
                height: parseFloat(sashglassh).toFixed(2)
            },  
            {
                line: 1,
                qty: 1,
                glassType: 'lowe2',
                Tmprd: 'T',
                Thickness: '3',
                width: parseFloat(sashglassw).toFixed(2),
                height: parseFloat(sashglassh).toFixed(2)
            },
            {
                line: 2,
                qty: 1,
                glassType: 'clear',
                Tmprd: 'T',
                Thickness: '3',
                width: parseFloat(fixedglassw).toFixed(2),
                height: parseFloat(fixedglassh).toFixed(2)
            },
            {
                line: 2,
                qty: 1,
                glassType: 'lowe2',
                Tmprd: 'T',
                Thickness: '3',
                width: parseFloat(fixedglassw).toFixed(2),
                height: parseFloat(fixedglassh).toFixed(2)
            }
        ];
    } else if (glassType === 'Clear/Low-E366 Tempered') {
        glassList = [
            {
                line: 1,
                qty: 1,
                glassType: 'clear',
                Tmprd: 'T',
                Thickness: '3',
                width: parseFloat(sashglassw).toFixed(2),
                height: parseFloat(sashglassh).toFixed(2)
            },  
            {
                line: 1,
                qty: 1,
                glassType: 'lowe3',
                Tmprd: 'T',
                Thickness: '3',
                width: parseFloat(sashglassw).toFixed(2),
                height: parseFloat(sashglassh).toFixed(2)
            },
            {
                line: 2,
                qty: 1,
                glassType: 'clear',
                Tmprd: 'T',
                Thickness: '3',
                width: parseFloat(fixedglassw).toFixed(2),
                height: parseFloat(fixedglassh).toFixed(2)
            },
            {
                line: 2,
                qty: 1,
                glassType: 'lowe3',
                Tmprd: 'T',
                Thickness: '3',
                width: parseFloat(fixedglassw).toFixed(2),
                height: parseFloat(fixedglassh).toFixed(2)
            }
        ];
    } else if (glassType === 'OBS/Clear Tempered') {
        glassList = [
            {
                line: 1,
                qty: 1,
                glassType: 'clear',
                Tmprd: 'T',
                Thickness: '3',
                width: parseFloat(sashglassw).toFixed(2),
                height: parseFloat(sashglassh).toFixed(2)
            },  
            {
                line: 1,
                qty: 1,
                glassType: 'OBS',
                Tmprd: 'T',
                Thickness: '3',
                width: parseFloat(sashglassw).toFixed(2),
                height: parseFloat(sashglassh).toFixed(2)
            },
            {
                line: 2,
                qty: 1,
                glassType: 'clear',
                Tmprd: 'T',
                Thickness: '3',
                width: parseFloat(fixedglassw).toFixed(2),
                height: parseFloat(fixedglassh).toFixed(2)
            },
            {
                line: 2,
                qty: 1,
                glassType: 'OBS',
                Tmprd: 'T',
                Thickness: '3',
                width: parseFloat(fixedglassw).toFixed(2),
                height: parseFloat(fixedglassh).toFixed(2)
            }
        ];
    } else if (glassType === 'OBS/Low-E270 Tempered') {
        glassList = [
            {
                line: 1,
                qty: 1,
                glassType: 'lowe2',
                Tmprd: 'T',
                Thickness: '3',
                width: parseFloat(sashglassw).toFixed(2),
                height: parseFloat(sashglassh).toFixed(2)
            },  
            {
                line: 1,
                qty: 1,
                glassType: 'OBS',
                Tmprd: 'T',
                Thickness: '3',
                width: parseFloat(sashglassw).toFixed(2),
                height: parseFloat(sashglassh).toFixed(2)
            },
            {
                line: 2,
                qty: 1,
                glassType: 'lowe2',
                Tmprd: 'T',
                Thickness: '3',
                width: parseFloat(fixedglassw).toFixed(2),
                height: parseFloat(fixedglassh).toFixed(2)
            },
            {
                line: 2,
                qty: 1,
                glassType: 'OBS',
                Tmprd: 'T',
                Thickness: '3',
                width: parseFloat(fixedglassw).toFixed(2),
                height: parseFloat(fixedglassh).toFixed(2)
            }
        ];
    } else if (glassType === 'OBS/Low-E366 Tempered') {
        glassList = [
            {
                line: 1,
                qty: 1,
                glassType: 'lowe3',
                Tmprd: 'T',
                Thickness: '3',
                width: parseFloat(sashglassw).toFixed(2),
                height: parseFloat(sashglassh).toFixed(2)
            },  
            {
                line: 1,
                qty: 1,
                glassType: 'OBS',
                Tmprd: 'T',
                Thickness: '3',
                width: parseFloat(sashglassw).toFixed(2),
                height: parseFloat(sashglassh).toFixed(2)
            },
            {
                line: 2,
                qty: 1,
                glassType: 'lowe3',
                Tmprd: 'T',
                Thickness: '3',
                width: parseFloat(fixedglassw).toFixed(2),
                height: parseFloat(fixedglassh).toFixed(2)
            },
            {
                line: 2,
                qty: 1,
                glassType: 'OBS',
                Tmprd: 'T',
                Thickness: '3',
                width: parseFloat(fixedglassw).toFixed(2),
                height: parseFloat(fixedglassh).toFixed(2)
            }
        ];
    } else {
        // Default to Clear/Clear if glass type not recognized
        glassList = [
            {
                line: 1,
                qty: 2,
                glassType: 'clear',
                Tmprd: '',
                Thickness: '3',
                width: parseFloat(sashglassw).toFixed(2),
                height: parseFloat(sashglassh).toFixed(2)
            },  
            {
                line: 2,
                qty: 2,
                glassType: 'clear',
                Tmprd: '',
                Thickness: '3',
                width: parseFloat(fixedglassw).toFixed(2),
                height: parseFloat(fixedglassh).toFixed(2)
            }
        ];
    }
    
    return glassList;
}

/**
 * 处理网格计算逻辑 - 从windowData中提取grid数据并计算参数
 * @param {Object} windowData - 窗户数据
 * @param {number} sashgridw - 嵌扇格子宽度
 * @param {number} sashgridh - 嵌扇格子高度
 * @param {number} fixedgridw - 固定格子宽度
 * @param {number} fixedgridh - 固定格子高度
 * @returns {Array} 格子列表
 */
function handleGridCalculations(windowData, sashgridw, sashgridh, fixedgridw, fixedgridh) {
    let gridList = [];
    
    // 确保windowData存在
    if (!windowData) {
        return gridList;
    }
    
    // 获取grid值，并转换为小写用于比较
    const gridValue = windowData.grid || '';
    const gridLower = typeof gridValue === 'string' ? gridValue.toLowerCase() : '';
    
    if (gridLower === 'standard') {
        // 从grid_size解析网格尺寸，格式通常为"3w x 3h"
        let gridsquareW = '';
        let gridsquareH = '';
        
        if (windowData && windowData.grid_size) {
            const gridSizeStr = windowData.grid_size;
            
            // 尝试解析类似"3w x 3h"的格式
            const wMatch = /(\d+)w/i.exec(gridSizeStr);
            const hMatch = /(\d+)h/i.exec(gridSizeStr);
            
            if (wMatch && wMatch[1]) {
                gridsquareW = parseInt(wMatch[1]);
            } else {
                gridsquareW = 3; // 默认值
            }
            
            if (hMatch && hMatch[1]) {
                gridsquareH = parseInt(hMatch[1]);
            } else {
                gridsquareH = 3; // 默认值
            }
        } else {
            gridsquareW = 3; // 默认值
            gridsquareH = 3; // 默认值
        }
        
        const SashWq = gridsquareH - 1;
        const holeW1 = sashgridw / (gridsquareW / 2);
        const SashHq = gridsquareW / 2 - 1;
        const holeH1 = sashgridh / gridsquareH;
        const FixWq = gridsquareH - 1;
        const holeW2 = fixedgridw / (gridsquareW / 2);
        const FixHq = gridsquareW / 2 - 1;
        const holeH2 = 32;
        
        gridList = [
            {
                sashgridw: sashgridw,
                SashWq: SashWq,
                holeW1: holeW1,
                sashgridh: sashgridh,
                SashHq: SashHq,
                holeH1: holeH1,
                fixedgridw: fixedgridw,
                FixWq: FixWq,
                holeW2: holeW2,
                fixedgridh: fixedgridh,
                FixHq: FixHq,
                holeH2: holeH2
            }
        ];
    } else if (gridLower === 'marginal') {
        gridList = [
            {
                sashgridw: sashgridw,
                SashWq: 2,
                holeW1: 102,
                sashgridh: sashgridh,
                SashHq: 2,
                holeH1: 70,
                fixedgridw: fixedgridw,
                FixWq: 2,
                holeW2: 102,
                fixedgridh: fixedgridh,
                FixHq: 2,
                holeH2: 102
            }
        ];
    } else if (gridLower === 'perimeter') {
        gridList = [
            {
                sashgridw: sashgridw,
                SashWq: 2,
                holeW1: 102,
                sashgridh: sashgridh,
                SashHq: 1,
                holeH1: 70,
                fixedgridw: fixedgridw,
                FixWq: 2,
                holeW2: 102,
                fixedgridh: fixedgridh,
                FixHq: 1,
                holeH2: 102
            }
        ];
    }
    
    return gridList;
}

/**
 * 计算Nailon类型窗户尺寸
 * @param {number} widthMm - 窗户宽度(毫米)
 * @param {number} heightMm - 窗户高度(毫米)
 * @param {string} glassType - 玻璃类型
 * @param {Object} windowData - 窗户数据
 * @returns {Object} 框架尺寸及相关数据
 */
async function calculateNailon(widthMm, heightMm, glassType, windowData) {
    // 从数据库获取公式
    const formulas = await getFormulas('xo_ox_window', 'nailon');
    
    // 检查是否获取到公式
    if (formulas.length === 0) {
        return {
            error: '未找到计算公式'
        };
    }
    
    // 创建计算上下文对象，包含所有需要的变量和函数
    const context = {
        widthMm, 
        heightMm,
        round,
        mmToInch,
        frameWidth: undefined,
        frameHeight: undefined, 
        sashWidth: undefined, 
        sashHeight: undefined,
        screenw: undefined, 
        screenh: undefined, 
        mullion: undefined, 
        mullionA: undefined, 
        handleA: undefined, 
        track: undefined,
        sashglassw: undefined, 
        sashglassh: undefined, 
        fixedglassw: undefined, 
        fixedglassh: undefined,
        sashgridw: undefined, 
        sashgridh: undefined, 
        fixedgridw: undefined, 
        fixedgridh: undefined
    };
    
    // 执行所有获取到的公式
    for (const formula of formulas) {
        try {
            // 修改公式字符串，去掉const关键字以避免创建块级作用域变量
            let executableCode = formula.formula_string
                .replace(/const\s+([a-zA-Z0-9_]+)\s*=/, '$1 =');
            
            // 在函数中执行代码，使其能访问context对象
            const execFunc = new Function('context', `
                with(context) {
                    ${executableCode}
                }
                return context;
            `);
            
            // 执行函数并更新上下文
            const updatedContext = execFunc(context);
            Object.assign(context, updatedContext);
        } catch (error) {
            console.error(`执行公式失败: ${formula.step_name}`, error);
        }
    }
    
    // 从计算上下文中提取所有计算后的变量
    const {
        frameWidth, frameHeight, sashWidth, sashHeight,
        screenw, screenh, mullion, mullionA, handleA, track,
        sashglassw, sashglassh, fixedglassw, fixedglassh,
        sashgridw, sashgridh, fixedgridw, fixedgridh
    } = context;


    // console.log('nailoncontext', context);
    
    
    // 准备所有部件数据，确保每个数组都是正确初始化的
    
    // 框架数据 - 直接硬编码确保正确创建
    const frameList = [];
    
    // 添加第一个框架元素
    frameList.push({
        material: '82-10',
        position: '--',
        length: frameWidth,
        qty: 2
    });
    
    // 添加第二个框架元素
    frameList.push({
        material: '82-10',
        position: '|',
        length: frameHeight,
        qty: 2
    });
    
    // 添加第三个框架元素
    frameList.push({
        material: '82-01',
        position: '--',
        length: frameWidth,
        qty: 2
    });
    
    // 添加第四个框架元素
    frameList.push({
        material: '82-01',
        position: '|',
        length: frameHeight,
        qty: 2
    });

    // 准备嵌扇数据
    const sashList = [
        {
            material: '82-03',
            position: '--',
            length: sashWidth,
            qty: 2
        },
        {
            material: '82-03',
            position: '|',
            length: sashHeight,
            qty: 1
        },
        {
            material: '82-05',
            position: '|',
            length: sashHeight,
            qty: 1
        }
    ];

    // 准备屏幕数据
    const screenList = [
        {
            material: 'screenw',
            position: '--',
            length: screenw,
            qty: 2
        },
        {
            material: 'screenh',
            position: '|',
            length: screenh,
            qty: 2
        }
    ];

    // 准备零部件数据
    const partsList = [
        {
            material: 'mullion',
            position: '|',
            length: mullion,
            qty: 1
        },
        {
            material: 'mullion aluminum',
            position: '|',
            length: mullionA,
            qty: 1
        },
        {
            material: 'handle aluminum',
            position: '|',
            length: handleA,
            qty: 1
        },
        {
            material: 'track',
            position: '--',
            length: track,
            qty: 1
        },
    ];    
    
    // 使用共享函数处理grid计算
    const gridList = handleGridCalculations(windowData, sashgridw, sashgridh, fixedgridw, fixedgridh);

    // 使用共享函数获取玻璃列表
    const glassList = getGlassList(glassType, sashglassw, sashglassh, fixedglassw, fixedglassh);

    // 构建结果对象 - 确保frame属性正确设置
    const result = {};
    
    // 逐个设置属性，避免整体结构赋值可能引起的问题
    result.frameWidth = frameWidth;
    result.frameHeight = frameHeight;
    result.frameType = 'Nailon';
    
    // 重要：确保frame属性正确设置，使用深度克隆以避免引用问题
    result.frame = JSON.parse(JSON.stringify(frameList));
    
    // 设置其他属性
    result.sash = sashList;
    result.screen = screenList;
    result.parts = partsList;
    result.glassList = glassList;
    result.gridList = gridList;
    
    // 检查是否有错误
    if (result.error) {
        console.error('窗户计算错误:', result.error);
    }
    
    console.log('nailon result', result);
    return result;
}

/**
 * 计算其他类型窗户尺寸
 * @param {number} widthMm - 窗户宽度(毫米)
 * @param {number} heightMm - 窗户高度(毫米)
 * @param {string} frame - 框架类型
 * @param {string} glassType - 玻璃类型
 * @param {Object} windowData - 窗户数据
 * @returns {Object} 框架尺寸及相关数据
 */
async function calculate3Style(widthMm, heightMm, frame, glassType, windowData) {
    // 从数据库获取公式
    const formulas = await getFormulas('xo_ox_window', 'other');
    
    // 检查是否获取到公式
    if (formulas.length === 0) {
        return {
            error: '未找到计算公式'
        };
    }
    
    // 创建计算上下文对象，包含所有需要的变量和函数
    const context = {
        widthMm, 
        heightMm,
        round,
        mmToInch,
        frameWidth: undefined,
        frameHeight: undefined, 
        sashWidth: undefined, 
        sashHeight: undefined,
        screenw: undefined, 
        screenh: undefined, 
        mullion: undefined, 
        mullionA: undefined, 
        handleA: undefined, 
        track: undefined,
        sashglassw: undefined, 
        sashglassh: undefined, 
        fixedglassw: undefined, 
        fixedglassh: undefined,
        sashgridw: undefined, 
        sashgridh: undefined, 
        fixedgridw: undefined, 
        fixedgridh: undefined
    };

    // console.log('3style context', context);
    
    // 执行所有获取到的公式
    for (const formula of formulas) {
        try {
            // 修改公式字符串，去掉const关键字以避免创建块级作用域变量
            let executableCode = formula.formula_string
                .replace(/const\s+([a-zA-Z0-9_]+)\s*=/, '$1 =');
            
            // 在函数中执行代码，使其能访问context对象
            const execFunc = new Function('context', `
                with(context) {
                    ${executableCode}
                }
                return context;
            `);
            
            // 执行函数并更新上下文
            const updatedContext = execFunc(context);
            Object.assign(context, updatedContext);
        } catch (error) {
            console.error(`执行公式失败: ${formula.step_name}`, error);
        }
    }
    
    // 从计算上下文中提取所有计算后的变量
    const {
        frameWidth, frameHeight, sashWidth, sashHeight,
        screenw, screenh, mullion, mullionA, handleA, track,
        sashglassw, sashglassh, fixedglassw, fixedglassh,
        sashgridw, sashgridh, fixedgridw, fixedgridh
    } = context;
    
    // 准备框架数据
    let frameList = [];
    
    if (frame === 'Retrofit') {
        // 第1种框架: 材料和数量
        frameList = [
            {
                material: '82-02',
                position: '--',
                length: frameWidth,
                qty: 2
            },
            {
                material: '82-02',
                position: '|',
                length: frameHeight,
                qty: 2
            }
        ];
    } else if (frame === 'Block') {
        // 第2和第4种框架: 左下2个，右下2个
        frameList = [
            {
                material: '82-01',
                position: '--',
                length: frameWidth,
                qty: 2
            },
            {
                material: '82-01',
                position: '|',
                length: frameHeight,
                qty: 2
            },
            {
                material: '82-01',
                position: '--',
                length: frameWidth,
                qty: 2
            },
            {
                material: '82-01',
                position: '|',
                length: frameHeight,
                qty: 2
            }
        ];
    } else if (frame === 'Block-slope') {
        // 第3种框架: 左上1个，左下1个，右下2个
        frameList = [
            {
                material: '82-02B',
                position: '--',
                length: frameWidth,
                qty: 1
            },
            {
                material: '82-01',
                position: '--',
                length: frameHeight,
                qty: 1
            },
            {
                material: '82-01',
                position: '|',
                length: frameHeight,
                qty: 2
            }
        ];
    }

    // 准备嵌扇数据
    const sashList = [
        {
            material: '82-03',
            position: '--',
            length: sashWidth,
            qty: 2
        },
        {
            material: '82-03',
            position: '|',
            length: sashHeight,
            qty: 1
        },
        {
            material: '82-05',
            position: '|',
            length: sashHeight,
            qty: 1
        }
    ];

    // 准备屏幕数据
    const screenList = [
        {
            material: 'screenw',
            position: '--',
            length: screenw,
            qty: 2
        },
        {
            material: 'screenh',
            position: '|',
            length: screenh,
            qty: 2
        }
    ];

    // 准备零部件数据
    const partsList = [
        {
            material: 'mullion',
            position: '|',
            length: mullion,
            qty: 1
        },
        {
            material: 'mullion aluminum',
            position: '|',
            length: mullionA,
            qty: 1
        },
        {
            material: 'handle aluminum',
            position: '|',
            length: handleA,
            qty: 1
        },
        {
            material: 'track',
            position: '--',
            length: track,
            qty: 1
        },
    ];  
    
    // 使用共享函数处理grid计算
    const gridList = handleGridCalculations(windowData, sashgridw, sashgridh, fixedgridw, fixedgridh);

    // 使用共享函数获取玻璃列表
    const glassList = getGlassList(glassType, sashglassw, sashglassh, fixedglassw, fixedglassh);
    
    // 构建结果对象
    const result = {
        frameWidth,
        frameHeight,
        frame: frameList,
        frameType: frame,
        sash: sashList,
        screen: screenList,
        parts: partsList,
        glassList: glassList,
        gridList: gridList
    };
    
    // 检查是否有错误
    if (result.error) {
        console.error('窗户计算错误:', result.error);
    }
    
    return result;
}

/**
 * 处理窗户数据并返回所有计算结果
 * @param {Object} windowData - 窗户基础数据
 * @returns {Object} 所有窗户计算结果
 */
async function processWindowData(windowData) {
    // 提取相关数据
    const { width, height, quantity, style, customer, id, glass, argon, grid, color, frame } = windowData;
    
    // 步骤1: 先转成mm
    const measurements = convertToMetric(width, height);
    const { widthMm, heightMm } = measurements;
    
    // 判断是否为Nailon类型窗户 - 同时检查style和frame字段
    const isNailon = (style && style.trim().toLowerCase() === 'nailon') || 
                    (frame && frame.trim().toLowerCase() === 'nailon');
    
    // 根据窗户类型选择计算方法
    let calculationResults = {};
    
    if (isNailon) {
        // Nailon窗户计算 - 传递整个窗户数据对象
        calculationResults = await calculateNailon(widthMm, heightMm, glass, windowData);
        // 确保frameType正确设置
        if (calculationResults) {
            calculationResults.frameType = 'Nailon';
        }
    } else {
        // 标准XO/OX窗户计算 - 传递整个窗户数据对象
        calculationResults = await calculate3Style(widthMm, heightMm, frame, glass, windowData);
    }
    
    // 检查是否有错误
    if (calculationResults.error) {
        console.error('窗户计算错误:', calculationResults.error);
    }
    
    // 合并所有计算结果
    const results = calculationResults;
    
    return results;
}

// 导出计算函数供其他模块使用
export {
    processWindowData,
    convertToMetric,
    mmToInch,
    calculate3Style,
    calculateNailon
}; 