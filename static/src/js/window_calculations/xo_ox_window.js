/**
 * XO/OX Window Style Calculations
 * Contains functions for calculating dimensions for XO and OX style windows
 */
odoo.define('rich_production.xo_ox_window', [], function (require) {
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
        
        console.log('handleGridCalculations被调用，参数:', {
            windowData: windowData ? {
                id: windowData.id,
                grid: windowData.grid,
                grid_size: windowData.grid_size
            } : 'undefined',
            sashgridw, sashgridh, fixedgridw, fixedgridh
        });
        
        // 确保windowData存在
        if (!windowData) {
            console.warn('windowData为空，无法计算grid');
            return gridList;
        }
        
        // 获取grid值，并转换为小写用于比较
        const gridValue = windowData.grid || '';
        const gridLower = typeof gridValue === 'string' ? gridValue.toLowerCase() : '';
        
        console.log('Grid值检查:', {
            原始grid: gridValue,
            小写grid: gridLower,
            isStandard: gridLower === 'standard',
            isMarginal: gridLower === 'marginal',
            isPerimeter: gridLower === 'perimeter'
        });
        
        if (gridLower === 'standard') {
            // 从grid_size解析网格尺寸，格式通常为"3w x 3h"
            let gridsquareW = '';
            let gridsquareH = '';
            
            if (windowData && windowData.grid_size) {
                const gridSizeStr = windowData.grid_size;
                console.log('解析grid_size:', gridSizeStr);
                
                // 尝试解析类似"3w x 3h"的格式
                const wMatch = /(\d+)w/i.exec(gridSizeStr);
                const hMatch = /(\d+)h/i.exec(gridSizeStr);
                
                if (wMatch && wMatch[1]) {
                    gridsquareW = parseInt(wMatch[1]);
                    console.log('提取到网格宽度:', gridsquareW);
                } else {
                    console.warn('未能从grid_size提取宽度:', gridSizeStr);
                    gridsquareW = 3; // 默认值
                }
                
                if (hMatch && hMatch[1]) {
                    gridsquareH = parseInt(hMatch[1]);
                    console.log('提取到网格高度:', gridsquareH);
                } else {
                    console.warn('未能从grid_size提取高度:', gridSizeStr);
                    gridsquareH = 3; // 默认值
                }
            } else {
                console.warn('windowData.grid_size为空，使用默认值');
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
            
            console.log('Grid计算结果:', {
                gridsquareW, gridsquareH,
                SashWq, holeW1, SashHq, holeH1,
                FixWq, holeW2, FixHq, holeH2
            });
            
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
            console.log('创建marginal格子数据');
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
            console.log('创建perimeter格子数据');
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
        } else {
            console.warn('不支持的grid类型:', gridValue);
        }
        
        console.log('handleGridCalculations返回结果:', gridList);
        return gridList;
    }

    /**
     * 计算XO/OX窗户的框架尺寸 (按Excel VBA逻辑)
     * @param {number} widthMm - 窗户宽度(毫米)
     * @param {number} heightMm - 窗户高度(毫米)
     * @param {number} frame - 框架类型索引(0-3)
     * @param {string} glassType - 玻璃类型
     * @returns {Object} 框架尺寸(英寸)
     * 
     */

    function calculateNailon(widthMm, heightMm, glassType, windowData) {
        const frameWidth = mmToInch(widthMm + 3 * 2);
        const frameHeight = mmToInch(heightMm + 3 * 2); 

        // Calculate sash width and height according to the formula
        const sashWidth = mmToInch(widthMm / 2 - 14.5 - 15 + 1);
        const sashHeight = mmToInch(heightMm - 46 - 15 * 2 - 2 - 1);


        
        const screenw = round(widthMm / 2 - 75 - 15 - (2), 0);
        const screenh = round(heightMm - 87 - 15 * 2 - (4), 0);


        const mullion = round((heightMm - 36 - 15 * 2) / 25.4, 3);
        const mullionA = round((heightMm - 36 - 15 * 2) / 25.4 - 2, 1);
        const handleA = round((heightMm - 46 - 15 * 2) / 25.4 / 2 + 4, 0);
        const track = round((widthMm - 14 * 2 - 15 * 2 - 3 - (20)) / 25.4, 1);


        const sashglassw = round(widthMm / 2 - 77 - 15 + (3), 0);
        const sashglassh = round(heightMm - 109 - 15 * 2 - (3) - (2), 0);
        const fixedglassw = round(widthMm / 2 - 44 - 15, 0);
        const fixedglassh = round(heightMm - 47 - 15 * 2 - (2), 0);

        const sashgridw = round(sashglassw - 18 - (2), 0);
        const sashgridh = round(sashglassh - 18 - (2), 0);
        const fixedgridw = round(fixedglassw - 18 - (2), 0);
        const fixedgridh = round(fixedglassh - 18 - (2), 0);
        
        // Prepare sash data (mimicking the sashwrite function call)
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
            },
            {
                material: '82-01',
                position: 'G4',
                length: frameWidth,
                qty: 2
            },
            {
                material: '82-01',
                position: 'J4',
                length: frameHeight,
                qty: 2
            }
        ];

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

        // 构建结果对象 (calculateNailon函数)
        const result = {
            frameWidth,
            frameHeight,
            frame: frameList,
            sash: sashList,
            screen: screenList,
            parts: partsList,
            glassList: glassList,
            gridList: gridList
        };
        
        // 只在有grid时输出日志
        if (windowData && windowData.grid && windowData.grid !== 'no' && windowData.grid !== 'none') {
            console.log('Nailon窗户Grid计算:', gridList);
        }
        return result;
    }


    function calculate3Style(widthMm, heightMm, frame, glassType, windowData) {
        
        const frameWidth = mmToInch(widthMm + 3 * 2);
        const frameHeight = mmToInch(heightMm + 3 * 2);

        const sashWidth = mmToInch(widthMm / 2 - 14.5 + 1);
        const sashHeight = mmToInch(heightMm - 46 - 2 - 1);

        const screenw = round(widthMm / 2 - 75 - (2), 0);
        const screenh = round(heightMm - 87 - (4), 0);


        const mullion = round((heightMm - 36) / 25.4, 3);
        const mullionA = round((heightMm - 36) / 25.4 - 2, 1);
        const handleA = round((heightMm - 46) / 25.4 / 2 + 4, 0);
        const track = round((widthMm - 14 * 2 - 3 - (20)) / 25.4, 1);


        
        const sashglassw = widthMm / 2 - 77 + (3);
        const sashglassh = heightMm - 109 - (3) - (2);
        const fixedglassw = widthMm / 2 - 44;
        const fixedglassh = heightMm - 47 - (2);
    
        
        
        let frameList = [];

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
        
        // 计算grid尺寸
        const sashgridw = round(sashglassw - 18 - (2), 0);
        const sashgridh = round(sashglassh - 18 - (2), 0);
        const fixedgridw = round(fixedglassw - 18 - (2), 0);
        const fixedgridh = round(fixedglassh - 18 - (2), 0);
        
        // 使用共享函数处理grid计算
        const gridList = handleGridCalculations(windowData, sashgridw, sashgridh, fixedgridw, fixedgridh);

        // 使用共享函数获取玻璃列表
        const glassList = getGlassList(glassType, sashglassw, sashglassh, fixedglassw, fixedglassh);

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
                    position: 'G4',
                    length: frameWidth,
                    qty: 2
                },
                {
                    material: '82-01',
                    position: 'J4',
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
        
        // 构建结果对象 (calculate3Style函数)
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
        
        // 只在有grid时输出日志
        if (windowData && windowData.grid && windowData.grid !== 'no' && windowData.grid !== 'none') {
            console.log('标准窗户Grid计算 (frame=' + frame + '):', gridList);
        }
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
        
        // 只保留grid相关日志
        console.log('处理窗户数据, grid信息:', {
            id, style, grid, grid_size: windowData.grid_size,
            grid类型: typeof windowData.grid,
            grid_size类型: typeof windowData.grid_size
        });
        
        // 步骤1: 先转成mm
        const measurements = convertToMetric(width, height);
        const { widthMm, heightMm } = measurements;
        
       
        
        // 根据窗户类型选择计算方法
        let calculationResults = {};
        
        if (style === 'Nailon') {
            // Nailon窗户计算 - 传递整个窗户数据对象
            calculationResults = calculateNailon(widthMm, heightMm, glass, windowData);
            
        } else {
            // 标准XO/OX窗户计算 - 传递整个窗户数据对象
            calculationResults = calculate3Style(widthMm, heightMm, frame, glass, windowData);
        }
        
        // 合并所有计算结果
        const results = calculationResults;
        
        // 仅当存在grid时输出日志
        console.log('窗户Grid计算结果:', {
            id: windowData.id,
            style: windowData.style,
            grid: windowData.grid,
            grid_size: windowData.grid_size,
            gridList: results.gridList || '未生成'
        });
        
        return results;
    }

    // 公开API
    return {
        processWindowData,
        convertToMetric,
        mmToInch,
        // 标准窗户计算函数
        calculate3Style,
        // Nailon窗户计算函数
        calculateNailon
    };
}); 