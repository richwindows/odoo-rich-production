/**
 * Picture Window Style Calculations
 * Contains functions for calculating dimensions for Picture style windows
 */
odoo.define('rich_production.picture_window', [], function (require) {
    'use strict';

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
     * 精确舍入到指定小数位数
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
     * 根据玻璃类型生成玻璃列表数据
     * @param {string} glassType - 玻璃类型
     * @param {number} fixedglassw - 固定玻璃宽度(毫米)
     * @param {number} fixedglassh - 固定玻璃高度(毫米)
     * @returns {Array} 玻璃列表
     */
    function getGlassList(glassType, fixedglassw, fixedglassh) {
        let glassList = [];
        
        // Picture窗户只有固定玻璃，数量由玻璃类型决定
        
        if (glassType === 'Clear/Clear') {
            glassList = [
                {
                    line: 1,
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
                    width: parseFloat(fixedglassw).toFixed(2),
                    height: parseFloat(fixedglassh).toFixed(2)
                },  
                {
                    line: 1,
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
                    width: parseFloat(fixedglassw).toFixed(2),
                    height: parseFloat(fixedglassh).toFixed(2)
                },  
                {
                    line: 1,
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
                    width: parseFloat(fixedglassw).toFixed(2),
                    height: parseFloat(fixedglassh).toFixed(2)
                },  
                {
                    line: 1,
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
                    width: parseFloat(fixedglassw).toFixed(2),
                    height: parseFloat(fixedglassh).toFixed(2)
                },  
                {
                    line: 1,
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
                    width: parseFloat(fixedglassw).toFixed(2),
                    height: parseFloat(fixedglassh).toFixed(2)
                },  
                {
                    line: 1,
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
                    width: parseFloat(fixedglassw).toFixed(2),
                    height: parseFloat(fixedglassh).toFixed(2)
                },  
                {
                    line: 1,
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
                    width: parseFloat(fixedglassw).toFixed(2),
                    height: parseFloat(fixedglassh).toFixed(2)
                },  
                {
                    line: 1,
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
                    width: parseFloat(fixedglassw).toFixed(2),
                    height: parseFloat(fixedglassh).toFixed(2)
                },  
                {
                    line: 1,
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
                    width: parseFloat(fixedglassw).toFixed(2),
                    height: parseFloat(fixedglassh).toFixed(2)
                },  
                {
                    line: 1,
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
                    width: parseFloat(fixedglassw).toFixed(2),
                    height: parseFloat(fixedglassh).toFixed(2)
                },  
                {
                    line: 1,
                    qty: 1,
                    glassType: 'OBS',
                    Tmprd: 'T',
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
     * @param {number} fixedgridw - 固定格子宽度
     * @param {number} fixedgridh - 固定格子高度
     * @returns {Array} 格子列表
     */
    function handleGridCalculations(windowData, fixedgridw, fixedgridh) {
        let gridList = [];
        
        console.log('Picture handleGridCalculations被调用，参数:', {
            windowData: windowData ? {
                id: windowData.id,
                grid: windowData.grid,
                grid_size: windowData.grid_size
            } : 'undefined',
            fixedgridw, fixedgridh
        });
        
        // 确保windowData存在
        if (!windowData) {
            console.warn('windowData为空，无法计算grid');
            return gridList;
        }
        
        // 获取grid值，并转换为小写用于比较
        const gridValue = windowData.grid || '';
        const gridLower = typeof gridValue === 'string' ? gridValue.toLowerCase() : '';
        const quantity = windowData.quantity || 1;
        
        if (gridLower === 'standard') {
            // 从grid_size解析网格尺寸，格式通常为"3w x 3h"
            let gridsquareW = 3; // 默认值
            let gridsquareH = 3; // 默认值
            
            if (windowData && windowData.grid_size) {
                const gridSizeStr = windowData.grid_size;
                console.log('解析grid_size:', gridSizeStr);
                
                // 尝试解析类似"3w x 3h"的格式
                const wMatch = /(\d+)w/i.exec(gridSizeStr);
                const hMatch = /(\d+)h/i.exec(gridSizeStr);
                
                if (wMatch && wMatch[1]) {
                    gridsquareW = parseInt(wMatch[1]);
                    console.log('提取到网格宽度:', gridsquareW);
                }
                
                if (hMatch && hMatch[1]) {
                    gridsquareH = parseInt(hMatch[1]);
                    console.log('提取到网格高度:', gridsquareH);
                }
            }
            
            // Picture格式网格计算
            const FixWq = gridsquareH - 1;
            const holeW2 = fixedgridw / gridsquareW;
            const FixHq = gridsquareW - 1;
            const holeH2 = fixedgridh / gridsquareH;
            
            console.log('Picture Grid计算结果:', {
                gridsquareW, gridsquareH,
                FixWq, holeW2, FixHq, holeH2
            });
            
            gridList = [
                {
                    fixedgridw,
                    FixWq,
                    holeW2,
                    fixedgridh,
                    FixHq,
                    holeH2
                }
            ];
        } else if (gridLower === 'marginal') {
            // 对于Picture类型的Marginal网格
            gridList = [
                {
                    fixedgridw,
                    FixWq: quantity * 2,
                    holeW2: 102,
                    fixedgridh,
                    FixHq: quantity * 2,
                    holeH2: 102
                }
            ];
        } else if (gridLower === 'perimeter') {
            // 对于Picture类型的Perimeter网格
            gridList = [
                {
                    fixedgridw,
                    FixWq: quantity * 2,
                    holeW2: 102,
                    fixedgridh,
                    FixHq: quantity * 2,
                    holeH2: 102
                }
            ];
        } else {
            console.warn('不支持的grid类型:', gridValue);
        }
        
        console.log('Picture handleGridCalculations返回结果:', gridList);
        return gridList;
    }

    /**
     * 计算Picture窗户的Nailon型材框架尺寸
     * @param {number} widthMm - 窗户宽度(毫米)
     * @param {number} heightMm - 窗户高度(毫米)
     * @param {string} glassType - 玻璃类型
     * @param {Object} windowData - 窗户完整数据
     * @returns {Object} 框架尺寸和其他计算结果
     */
    function calculatePictureNailon(widthMm, heightMm, glassType, windowData) {
        console.log('计算Picture Nailon窗户尺寸:', { widthMm, heightMm, glassType });
        
        // 框架尺寸计算
        const frameWidth = mmToInch(widthMm + 3 * 2);
        const frameHeight = mmToInch(heightMm + 3 * 2);
        
        // 封面尺寸计算
        const coverWidth = round((widthMm - 14 * 2 - 15 * 2 - 3 - 13) / 25.4, 3);
        const coverHeight = round((heightMm - 14 * 2 - 15 * 2 - 22 * 2 - 3.175) / 25.4, 3);
        
        // 玻璃尺寸计算
        const fixedglassw = round(widthMm - 47 - 15 * 2 - 2, 0);
        const fixedglassh = round(heightMm - 47 - 15 * 2 - 2, 0);
        
        // 格子尺寸计算
        const fixedgridw = round(fixedglassw - 18 - 2, 0);
        const fixedgridh = round(fixedglassh - 18 - 2, 0);
        
        // 框架清单 - Nailon型材
        const frameList = [
            {
                material: '82-10',
                position: '--',
                length: frameWidth,
                qty: 2
            },
            {
                material: '82-10',
                position: '|',
                length: frameHeight,
                qty: 2
            }
        ];
        
        // 部件清单
        const partsList = [
            {
                material: 'cover',
                position: '--',
                length: coverWidth,
                qty: 1
            },
            {
                material: 'cover',
                position: '|',
                length: coverHeight,
                qty: 1
            }
        ];
        
        // 计算格子清单
        const gridList = handleGridCalculations(windowData, fixedgridw, fixedgridh);
        
        // 计算玻璃清单
        const glassList = getGlassList(glassType, fixedglassw, fixedglassh);
        
        // 构建结果对象
        const result = {
            frameWidth,
            frameHeight,
            coverWidth,
            coverHeight,
            frame: frameList,
            parts: partsList,
            glassList: glassList,
            gridList: gridList
        };
        
        console.log('Picture Nailon窗户计算结果:', result);
        return result;
    }

    /**
     * 计算Picture窗户的标准框架尺寸 (Retrofit/Block/Block-slope)
     * @param {number} widthMm - 窗户宽度(毫米)
     * @param {number} heightMm - 窗户高度(毫米)
     * @param {string} frameType - 框架类型 (Retrofit/Block/Block-slope/Block-slope 1/2)
     * @param {string} glassType - 玻璃类型
     * @param {Object} windowData - 窗户完整数据
     * @returns {Object} 框架尺寸和其他计算结果
     */
    function calculatePictureStandard(widthMm, heightMm, frameType, glassType, windowData) {
        console.log('计算Picture标准窗户尺寸:', { widthMm, heightMm, frameType, glassType });
        
        // 框架尺寸计算
        const frameWidth = mmToInch(widthMm + 3 * 2);
        const frameHeight = mmToInch(heightMm + 3 * 2);
        
        // 封面尺寸计算
        const coverWidth = round((widthMm - 14 * 2 - 3 - 13) / 25.4, 3);
        const coverHeight = round((heightMm - 14 * 2 - 22 * 2 - 3.175) / 25.4, 3);
        
        // 特殊斜面尺寸 (只在Block-slope 1/2类型使用)
        const slopWidth = frameType === 'Block-slope 1/2' ? round((widthMm - 10) / 25.4, 1) : 0;
        
        // 玻璃尺寸计算
        const fixedglassw = round(widthMm - 47 - 2, 0);
        const fixedglassh = round(heightMm - 47 - 2, 0);
        
        // 格子尺寸计算
        const fixedgridw = round(fixedglassw - 18 - 2, 0);
        const fixedgridh = round(fixedglassh - 18 - 2, 0);
        
        // 根据框架类型创建框架清单
        let frameList = [];
        
        if (frameType === 'Retrofit') {
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
        } else if (frameType === 'Block' || frameType === 'Block-slope 1/2') {
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
                }
            ];
        } else if (frameType === 'Block-slope') {
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
                    length: frameWidth,
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
        
        // 部件清单
        const partsList = [
            {
                material: 'cover',
                position: '--',
                length: coverWidth,
                qty: 1
            },
            {
                material: 'cover',
                position: '|',
                length: coverHeight,
                qty: 1
            }
        ];
        
        // 添加斜度部件 (如果需要)
        if (frameType === 'Block-slope 1/2') {
            partsList.push({
                material: 'slop',
                position: '--',
                length: slopWidth,
                qty: 1
            });
        }
        
        // 计算格子清单
        const gridList = handleGridCalculations(windowData, fixedgridw, fixedgridh);
        
        // 计算玻璃清单
        const glassList = getGlassList(glassType, fixedglassw, fixedglassh);
        
        // 构建结果对象
        const result = {
            frameWidth,
            frameHeight,
            coverWidth,
            coverHeight,
            frame: frameList,
            frameType: frameType,
            parts: partsList,
            glassList: glassList,
            gridList: gridList
        };
        
        console.log('Picture标准窗户计算结果:', result);
        return result;
    }

    /**
     * 处理窗户数据并返回所有计算结果
     * @param {Object} windowData - 窗户基础数据
     * @returns {Object} 所有窗户计算结果
     */
    function processWindowData(windowData) {
        // 提取相关数据
        const { width, height, quantity, style, customer, id, glass, argon, grid, color, frame } = windowData;
        
        console.log('处理Picture窗户数据:', {
            id, style, width, height, frame, glass, grid, grid_size: windowData.grid_size
        });
        
        // 转换为毫米
        const measurements = convertToMetric(width, height);
        const { widthMm, heightMm } = measurements;
        
        // 根据框架类型选择计算方法
        let calculationResults = {};
        
        if (frame === 'Nailon') {
            calculationResults = calculatePictureNailon(widthMm, heightMm, glass, windowData);
        } else {
            calculationResults = calculatePictureStandard(widthMm, heightMm, frame, glass, windowData);
        }
        
        console.log('Picture窗户计算完成:', id);
        return calculationResults;
    }

    // 公开API
    return {
        processWindowData,
        convertToMetric,
        mmToInch,
        // 标准窗户计算函数
        calculatePictureStandard,
        // Nailon窗户计算函数
        calculatePictureNailon
    };
}); 