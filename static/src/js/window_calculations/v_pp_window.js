/**
 * V-PP Window Calculations
 * Contains functions for calculating dimensions for V-PP style windows
 */
odoo.define('rich_production.v_pp_window', [], function (require) {
    'use strict';

    /**
     * Converts imperial measurements to metric (mm)
     * @param {string|number} width - Width in inches
     * @param {string|number} height - Height in inches
     * @returns {Object} Object with metric measurements
     */
    function convertToMetric(width, height) {
        // Ensure values are numbers
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
     * @param {boolean} isTempered - 是否强化
     * @param {number} quantity - 数量
     * @returns {Array} 玻璃列表
     */
    function getGlassList(glassType, fixedglassw, fixedglassh, isTempered, quantity) {
        let glassList = [];
        const temperedMark = isTempered ? 'T' : '';
        const q = quantity || 1;
        
        if (glassType === 'Clear/Clear') {
            glassList = [
                {
                    line: 1,
                    qty: 4 * q,
                    glassType: 'clear',
                    Tmprd: temperedMark,
                    Thickness: '3',
                    width: parseFloat(fixedglassw).toFixed(2),
                    height: parseFloat(fixedglassh).toFixed(2)
                }
            ];
            
            // Add order for tempered glass if needed
            if (isTempered) {
                glassList.push({
                    line: 'order',
                    lineNumber: 1,
                    qty: 4 * q,
                    glassType: 'Clear',
                    Tmprd: 'Tempered',
                    width: parseFloat(fixedglassw).toFixed(2),
                    height: parseFloat(fixedglassh).toFixed(2)
                });
            }
        } else if (glassType === 'Clear/Low-E270') {
            glassList = [
                {
                    line: 1,
                    qty: 2 * q,
                    glassType: 'clear',
                    Tmprd: temperedMark,
                    Thickness: '3',
                    width: parseFloat(fixedglassw).toFixed(2),
                    height: parseFloat(fixedglassh).toFixed(2)
                },
                {
                    line: 1,
                    qty: 2 * q,
                    glassType: 'lowe2',
                    Tmprd: temperedMark,
                    Thickness: '3',
                    width: parseFloat(fixedglassw).toFixed(2),
                    height: parseFloat(fixedglassh).toFixed(2)
                }
            ];
            
            // Add order for tempered glass if needed
            if (isTempered) {
                glassList.push({
                    line: 'order',
                    lineNumber: 1,
                    qty: 2 * q,
                    glassType: 'Clear',
                    Tmprd: 'Tempered',
                    width: parseFloat(fixedglassw).toFixed(2),
                    height: parseFloat(fixedglassh).toFixed(2)
                });
                glassList.push({
                    line: 'order',
                    lineNumber: 1,
                    qty: 2 * q,
                    glassType: 'Lowe270',
                    Tmprd: 'Tempered',
                    width: parseFloat(fixedglassw).toFixed(2),
                    height: parseFloat(fixedglassh).toFixed(2)
                });
            }
        } else if (glassType === 'Clear/Low-E366') {
            glassList = [
                {
                    line: 1,
                    qty: 2 * q,
                    glassType: 'clear',
                    Tmprd: temperedMark,
                    Thickness: '3',
                    width: parseFloat(fixedglassw).toFixed(2),
                    height: parseFloat(fixedglassh).toFixed(2)
                },
                {
                    line: 1,
                    qty: 2 * q,
                    glassType: 'lowe3',
                    Tmprd: temperedMark,
                    Thickness: '3',
                    width: parseFloat(fixedglassw).toFixed(2),
                    height: parseFloat(fixedglassh).toFixed(2)
                }
            ];
            
            // Add order for tempered glass if needed
            if (isTempered) {
                glassList.push({
                    line: 'order',
                    lineNumber: 1,
                    qty: 2 * q,
                    glassType: 'Clear',
                    Tmprd: 'Tempered',
                    width: parseFloat(fixedglassw).toFixed(2),
                    height: parseFloat(fixedglassh).toFixed(2)
                });
                glassList.push({
                    line: 'order',
                    lineNumber: 1,
                    qty: 2 * q,
                    glassType: 'Lowe366',
                    Tmprd: 'Tempered',
                    width: parseFloat(fixedglassw).toFixed(2),
                    height: parseFloat(fixedglassh).toFixed(2)
                });
            }
        } else if (glassType === 'OBS/Clear') {
            glassList = [
                {
                    line: 1,
                    qty: 2 * q,
                    glassType: 'clear',
                    Tmprd: temperedMark,
                    Thickness: '3',
                    width: parseFloat(fixedglassw).toFixed(2),
                    height: parseFloat(fixedglassh).toFixed(2)
                },
                {
                    line: 1,
                    qty: 2 * q,
                    glassType: 'OBS',
                    Tmprd: temperedMark,
                    Thickness: '3',
                    width: parseFloat(fixedglassw).toFixed(2),
                    height: parseFloat(fixedglassh).toFixed(2)
                }
            ];
            
            // Add order for tempered glass if needed
            if (isTempered) {
                glassList.push({
                    line: 'order',
                    lineNumber: 1,
                    qty: 2 * q,
                    glassType: 'Clear',
                    Tmprd: 'Tempered',
                    width: parseFloat(fixedglassw).toFixed(2),
                    height: parseFloat(fixedglassh).toFixed(2)
                });
                glassList.push({
                    line: 'order',
                    lineNumber: 1,
                    qty: 2 * q,
                    glassType: 'P516',
                    Tmprd: 'Tempered',
                    width: parseFloat(fixedglassw).toFixed(2),
                    height: parseFloat(fixedglassh).toFixed(2)
                });
            }
        } else if (glassType === 'OBS/Low-E270') {
            glassList = [
                {
                    line: 1,
                    qty: 2 * q,
                    glassType: 'lowe2',
                    Tmprd: temperedMark,
                    Thickness: '3',
                    width: parseFloat(fixedglassw).toFixed(2),
                    height: parseFloat(fixedglassh).toFixed(2)
                },
                {
                    line: 1,
                    qty: 2 * q,
                    glassType: 'OBS',
                    Tmprd: temperedMark,
                    Thickness: '3',
                    width: parseFloat(fixedglassw).toFixed(2),
                    height: parseFloat(fixedglassh).toFixed(2)
                }
            ];
            
            // Add order for tempered glass if needed
            if (isTempered) {
                glassList.push({
                    line: 'order',
                    lineNumber: 1,
                    qty: 2 * q,
                    glassType: 'Lowe270',
                    Tmprd: 'Tempered',
                    width: parseFloat(fixedglassw).toFixed(2),
                    height: parseFloat(fixedglassh).toFixed(2)
                });
                glassList.push({
                    line: 'order',
                    lineNumber: 1,
                    qty: 2 * q,
                    glassType: 'P516',
                    Tmprd: 'Tempered',
                    width: parseFloat(fixedglassw).toFixed(2),
                    height: parseFloat(fixedglassh).toFixed(2)
                });
            }
        } else if (glassType === 'OBS/Low-E366') {
            glassList = [
                {
                    line: 1,
                    qty: 2 * q,
                    glassType: 'lowe3',
                    Tmprd: temperedMark,
                    Thickness: '3',
                    width: parseFloat(fixedglassw).toFixed(2),
                    height: parseFloat(fixedglassh).toFixed(2)
                },
                {
                    line: 1,
                    qty: 2 * q,
                    glassType: 'OBS',
                    Tmprd: temperedMark,
                    Thickness: '3',
                    width: parseFloat(fixedglassw).toFixed(2),
                    height: parseFloat(fixedglassh).toFixed(2)
                }
            ];
            
            // Add order for tempered glass if needed
            if (isTempered) {
                glassList.push({
                    line: 'order',
                    lineNumber: 1,
                    qty: 2 * q,
                    glassType: 'Lowe366',
                    Tmprd: 'Tempered',
                    width: parseFloat(fixedglassw).toFixed(2),
                    height: parseFloat(fixedglassh).toFixed(2)
                });
                glassList.push({
                    line: 'order',
                    lineNumber: 1,
                    qty: 2 * q,
                    glassType: 'P516',
                    Tmprd: 'Tempered',
                    width: parseFloat(fixedglassw).toFixed(2),
                    height: parseFloat(fixedglassh).toFixed(2)
                });
            }
        } else if (glassType === 'Clear/Clear Tmp') {
            // All glass tempered
            glassList = [
                {
                    line: 1,
                    qty: 4 * q,
                    glassType: 'clear',
                    Tmprd: 'T',
                    Thickness: '3',
                    width: parseFloat(fixedglassw).toFixed(2),
                    height: parseFloat(fixedglassh).toFixed(2)
                }
            ];
            
            // Add orders for tempered glass
            glassList.push({
                line: 'order',
                lineNumber: 1,
                qty: 4 * q,
                glassType: 'Clear',
                Tmprd: 'Tempered',
                width: parseFloat(fixedglassw).toFixed(2),
                height: parseFloat(fixedglassh).toFixed(2)
            });
        } else if (glassType === 'Clear/Low-E270 Tmp') {
            // All glass tempered
            glassList = [
                {
                    line: 1,
                    qty: 2 * q,
                    glassType: 'clear',
                    Tmprd: 'T',
                    Thickness: '3',
                    width: parseFloat(fixedglassw).toFixed(2),
                    height: parseFloat(fixedglassh).toFixed(2)
                },
                {
                    line: 1,
                    qty: 2 * q,
                    glassType: 'lowe2',
                    Tmprd: 'T',
                    Thickness: '3',
                    width: parseFloat(fixedglassw).toFixed(2),
                    height: parseFloat(fixedglassh).toFixed(2)
                }
            ];
            
            // Add orders for tempered glass
            glassList.push({
                line: 'order',
                lineNumber: 1,
                qty: 2 * q,
                glassType: 'Clear',
                Tmprd: 'Tempered',
                width: parseFloat(fixedglassw).toFixed(2),
                height: parseFloat(fixedglassh).toFixed(2)
            });
            glassList.push({
                line: 'order',
                lineNumber: 1,
                qty: 2 * q,
                glassType: 'Lowe270',
                Tmprd: 'Tempered',
                width: parseFloat(fixedglassw).toFixed(2),
                height: parseFloat(fixedglassh).toFixed(2)
            });
        } else if (glassType === 'Clear/Low-E366 Tmp') {
            // All glass tempered
            glassList = [
                {
                    line: 1,
                    qty: 2 * q,
                    glassType: 'clear',
                    Tmprd: 'T',
                    Thickness: '3',
                    width: parseFloat(fixedglassw).toFixed(2),
                    height: parseFloat(fixedglassh).toFixed(2)
                },
                {
                    line: 1,
                    qty: 2 * q,
                    glassType: 'lowe3',
                    Tmprd: 'T',
                    Thickness: '3',
                    width: parseFloat(fixedglassw).toFixed(2),
                    height: parseFloat(fixedglassh).toFixed(2)
                }
            ];
            
            // Add orders for tempered glass
            glassList.push({
                line: 'order',
                lineNumber: 1,
                qty: 2 * q,
                glassType: 'Clear',
                Tmprd: 'Tempered',
                width: parseFloat(fixedglassw).toFixed(2),
                height: parseFloat(fixedglassh).toFixed(2)
            });
            glassList.push({
                line: 'order',
                lineNumber: 1,
                qty: 2 * q,
                glassType: 'Lowe366',
                Tmprd: 'Tempered',
                width: parseFloat(fixedglassw).toFixed(2),
                height: parseFloat(fixedglassh).toFixed(2)
            });
        } else if (glassType === 'OBS/Clear Tmp') {
            // All glass tempered
            glassList = [
                {
                    line: 1,
                    qty: 2 * q,
                    glassType: 'clear',
                    Tmprd: 'T',
                    Thickness: '3',
                    width: parseFloat(fixedglassw).toFixed(2),
                    height: parseFloat(fixedglassh).toFixed(2)
                },
                {
                    line: 1,
                    qty: 2 * q,
                    glassType: 'OBS',
                    Tmprd: 'T',
                    Thickness: '3',
                    width: parseFloat(fixedglassw).toFixed(2),
                    height: parseFloat(fixedglassh).toFixed(2)
                }
            ];
            
            // Add orders for tempered glass
            glassList.push({
                line: 'order',
                lineNumber: 1,
                qty: 2 * q,
                glassType: 'Clear',
                Tmprd: 'Tempered',
                width: parseFloat(fixedglassw).toFixed(2),
                height: parseFloat(fixedglassh).toFixed(2)
            });
            glassList.push({
                line: 'order',
                lineNumber: 1,
                qty: 2 * q,
                glassType: 'P516',
                Tmprd: 'Tempered',
                width: parseFloat(fixedglassw).toFixed(2),
                height: parseFloat(fixedglassh).toFixed(2)
            });
        } else if (glassType === 'OBS/Low-E270 Tmp') {
            // All glass tempered
            glassList = [
                {
                    line: 1,
                    qty: 2 * q,
                    glassType: 'lowe2',
                    Tmprd: 'T',
                    Thickness: '3',
                    width: parseFloat(fixedglassw).toFixed(2),
                    height: parseFloat(fixedglassh).toFixed(2)
                },
                {
                    line: 1,
                    qty: 2 * q,
                    glassType: 'OBS',
                    Tmprd: 'T',
                    Thickness: '3',
                    width: parseFloat(fixedglassw).toFixed(2),
                    height: parseFloat(fixedglassh).toFixed(2)
                }
            ];
            
            // Add orders for tempered glass
            glassList.push({
                line: 'order',
                lineNumber: 1,
                qty: 2 * q,
                glassType: 'Lowe270',
                Tmprd: 'Tempered',
                width: parseFloat(fixedglassw).toFixed(2),
                height: parseFloat(fixedglassh).toFixed(2)
            });
            glassList.push({
                line: 'order',
                lineNumber: 1,
                qty: 2 * q,
                glassType: 'P516',
                Tmprd: 'Tempered',
                width: parseFloat(fixedglassw).toFixed(2),
                height: parseFloat(fixedglassh).toFixed(2)
            });
        } else if (glassType === 'OBS/Low-E366 Tmp') {
            // All glass tempered
            glassList = [
                {
                    line: 1,
                    qty: 2 * q,
                    glassType: 'lowe3',
                    Tmprd: 'T',
                    Thickness: '3',
                    width: parseFloat(fixedglassw).toFixed(2),
                    height: parseFloat(fixedglassh).toFixed(2)
                },
                {
                    line: 1,
                    qty: 2 * q,
                    glassType: 'OBS',
                    Tmprd: 'T',
                    Thickness: '3',
                    width: parseFloat(fixedglassw).toFixed(2),
                    height: parseFloat(fixedglassh).toFixed(2)
                }
            ];
            
            // Add orders for tempered glass
            glassList.push({
                line: 'order',
                lineNumber: 1,
                qty: 2 * q,
                glassType: 'Lowe366',
                Tmprd: 'Tempered',
                width: parseFloat(fixedglassw).toFixed(2),
                height: parseFloat(fixedglassh).toFixed(2)
            });
            glassList.push({
                line: 'order',
                lineNumber: 1,
                qty: 2 * q,
                glassType: 'P516',
                Tmprd: 'Tempered',
                width: parseFloat(fixedglassw).toFixed(2),
                height: parseFloat(fixedglassh).toFixed(2)
            });
        }
        
        return glassList;
    }

    /**
     * 处理网格计算
     * @param {Object} windowData - 窗户数据
     * @param {number} fixedgridw - 固定窗网格宽度
     * @param {number} fixedgridh - 固定窗网格高度
     * @returns {Array} 网格计算结果列表
     */
    function handleGridCalculations(windowData, fixedgridw, fixedgridh) {
        let gridList = [];
        
        console.log('V-PP handleGridCalculations被调用，参数:', {
            windowData: windowData ? {
                id: windowData.id,
                grid: windowData.grid,
                grid_size: windowData.grid_size,
                quantity: windowData.quantity
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
            
            // V-PP窗户的网格
            gridList.push({
                fixedgridw,
                FixWq: gridsquareH - 1,
                holeW: fixedgridw / gridsquareW,
                fixedgridh,
                FixHq: gridsquareW - 1,
                holeH: fixedgridh / gridsquareH
            });
            
        } else if (gridLower === 'marginal') {
            // 边缘型网格
            gridList.push({
                fixedgridw,
                FixWq: quantity * 4,
                holeW: 102,
                fixedgridh,
                FixHq: quantity * 4,
                holeH: 102
            });
            
        } else if (gridLower === 'perimeter') {
            // 周边型网格
            gridList.push({
                fixedgridw,
                FixWq: quantity * 4,
                holeW: 102,
                fixedgridh,
                FixHq: quantity * 4,
                holeH: 102
            });
        } else {
            console.warn('不支持的grid类型:', gridValue);
        }
        
        console.log('V-PP handleGridCalculations返回结果:', gridList);
        return gridList;
    }

    /**
     * 计算V-PP窗户的Nailon型材框架尺寸
     * @param {number} widthMm - 窗户宽度(毫米)
     * @param {number} heightMm - 窗户高度(毫米) 
     * @param {string} glassType - 玻璃类型
     * @param {Object} windowData - 窗户完整数据
     * @returns {Object} 框架尺寸和其他计算结果
     */
    function calculateVPPNailon(widthMm, heightMm, glassType, windowData) {
        console.log('计算V-PP Nailon窗户尺寸:', { widthMm, heightMm, glassType });
        
        const quantity = windowData.quantity || 1;
        
        // 框架尺寸计算
        const frameWidth = mmToInch(widthMm + 3 * 2);
        const frameHeight = mmToInch(heightMm + 3 * 2);
        
        // 部件计算 - 注意V-PP的宽高计算与H-PP相反
        const coverWidth = mmToInch(widthMm - 14 * 2 - 15 * 2 - 22 * 2 - 3 - 13);
        const coverHeight = mmToInch(heightMm / 2 - 6 - 14 * 2 - 15);
        const bigMullion = mmToInch(widthMm - 14 * 2 - 15 * 2 - 2 + 1.5);
        
        // 玻璃尺寸计算
        const fixedGlassWidth = widthMm - 20.5 * 2 - 3 * 2 - 15 * 2;
        const fixedGlassHeight = heightMm / 2 - 6 - 20.5 * 2 - 3 * 2 - 15 - 3;
        
        // 格子尺寸计算
        const fixedGridWidth = Math.round(fixedGlassWidth - 18 - 2);
        const fixedGridHeight = Math.round(fixedGlassHeight - 18 - 2);
        
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
                material: 'cover width',
                position: '--',
                length: coverWidth,
                qty: 1
            },
            {
                material: 'cover height',
                position: '|',
                length: coverHeight,
                qty: 1
            },
            {
                material: 'big mullion',
                position: '--',
                length: bigMullion,
                qty: 1
            }
        ];
        
        // 计算格子清单
        const gridList = handleGridCalculations(
            windowData, 
            fixedGridWidth, fixedGridHeight
        );
        
        // 计算玻璃清单
        const glassList = getGlassList(
            glassType, 
            fixedGlassWidth, fixedGlassHeight,
            windowData.top_buttom === 'Tempered',
            quantity
        );
        
        // 构建结果对象
        const result = {
            frameWidth,
            frameHeight,
            frame: frameList,
            parts: partsList,
            glassList: glassList,
            gridList: gridList
        };
        
        console.log('V-PP Nailon窗户计算结果:', result);
        return result;
    }

    /**
     * 计算V-PP窗户的标准框架尺寸 (Retrofit/Block/Block-slope)
     * @param {number} widthMm - 窗户宽度(毫米)
     * @param {number} heightMm - 窗户高度(毫米)
     * @param {string} frameType - 框架类型 (Retrofit/Block/Block-slope)
     * @param {string} glassType - 玻璃类型
     * @param {Object} windowData - 窗户完整数据
     * @returns {Object} 框架尺寸和其他计算结果
     */
    function calculateVPPStandard(widthMm, heightMm, frameType, glassType, windowData) {
        console.log('计算V-PP标准窗户尺寸:', { widthMm, heightMm, frameType, glassType });
        
        const quantity = windowData.quantity || 1;
        
        // 框架尺寸计算
        const frameWidth = mmToInch(widthMm + 3 * 2);
        const frameHeight = mmToInch(heightMm + 3 * 2);
        
        // 部件计算 - V-PP特有的尺寸计算
        const coverWidth = mmToInch(widthMm - 14 * 2 - 22 * 2 - 3 - 13);
        const coverHeight = mmToInch(heightMm / 2 - 6 - 14 * 2 - 15);
        const bigMullion = mmToInch(widthMm - 14 * 2 - 2 + 1.5);
        const slop = frameType === 'Block-slop 1/2' ? round((widthMm - 10) / 25.4, 1) : 0;
        
        // 玻璃尺寸计算
        const fixedGlassWidth = widthMm - 20.5 * 2 - 3 * 2 ;
        const fixedGlassHeight = heightMm / 2 - 6 - 20.5 * 2 - 3 * 2 - 3;
        
        // 格子尺寸计算
        const fixedGridWidth = Math.round(fixedGlassWidth - 18 - 2);
        const fixedGridHeight = Math.round(fixedGlassHeight - 18 - 2);
        
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
        } else if (frameType === 'Block' || frameType === 'Block-slop 1/2') {
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
        } else if (frameType === 'Block-slop') {
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
                material: 'cover width',
                position: '--',
                length: coverWidth,
                qty: 1
            },
            {
                material: 'cover height',
                position: '|',
                length: coverHeight,
                qty: 1
            },
            {
                material: 'big mullion',
                position: '--',
                length: bigMullion,
                qty: 1
            }
        ];
        
        // 添加斜度部件 (如果需要)
        if (frameType === 'Block-slop 1/2') {
            partsList.push({
                material: 'slop',
                position: '--',
                length: slop,
                qty: 1
            });
        }
        
        // 计算格子清单
        const gridList = handleGridCalculations(
            windowData, 
            fixedGridWidth, fixedGridHeight
        );
        
        // 计算玻璃清单
        const glassList = getGlassList(
            glassType, 
            fixedGlassWidth, fixedGlassHeight,
            windowData.top_buttom === 'Tempered',
            quantity
        );
        
        // 构建结果对象
        const result = {
            frameWidth,
            frameHeight,
            frameType: frameType,
            frame: frameList,
            parts: partsList,
            glassList: glassList,
            gridList: gridList
        };
        
        console.log('V-PP标准窗户计算结果:', result);
        return result;
    }

    /**
     * 处理窗户数据并返回所有计算结果
     * @param {Object} windowData - 窗户基础数据
     * @returns {Object} 所有窗户计算结果
     */
    function processWindowData(windowData) {
        // 提取相关数据
        const { width, height, quantity, style, customer, id, glass, argon, grid, grid_size, color, frame, top_buttom } = windowData;
        
        console.log('处理V-PP窗户数据:', {
            id, style, width, height, frame, glass, grid, grid_size,
            top_buttom
        });
        
        // 转换为毫米
        const measurements = convertToMetric(width, height);
        const { widthMm, heightMm } = measurements;
        
        // 根据框架类型选择计算方法
        let calculationResults = {};
        
        if (frame === 'Nailon') {
            calculationResults = calculateVPPNailon(widthMm, heightMm, glass, windowData);
        } else {
            calculationResults = calculateVPPStandard(widthMm, heightMm, frame, glass, windowData);
        }
        
        console.log('V-PP窗户计算完成:', id);
        return calculationResults;
    }

    // 公开API
    return {
        processWindowData,
        convertToMetric,
        mmToInch,
        // 标准窗户计算函数
        calculateVPPStandard,
        // Nailon窗户计算函数
        calculateVPPNailon
    };
}); 