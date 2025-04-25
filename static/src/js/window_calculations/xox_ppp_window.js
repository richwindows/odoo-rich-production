/**
 * XOX-PPP Window Style Calculations
 * Contains functions for calculating dimensions for XOX-PPP style windows
 * (Triple Picture on top, XOX on bottom)
 */
odoo.define('rich_custom.xox_ppp_window', function (require) {
    'use strict';

    var abstractWindow = require('rich_custom.abstract_window');

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
     * @param {number} sashGlassW - 滑动部分玻璃宽度(毫米)
     * @param {number} sashGlassH - 滑动部分玻璃高度(毫米)
     * @param {number} fixedGlassW - 固定部分玻璃宽度(毫米)
     * @param {number} fixedGlassH - 固定部分玻璃高度(毫米)
     * @param {number} fixedGlass2W - 顶部左右侧固定部分玻璃宽度(毫米)
     * @param {number} fixedGlass2H - 顶部左右侧固定部分玻璃高度(毫米)
     * @param {number} fixedGlass3W - 顶部中间固定部分玻璃宽度(毫米)
     * @param {number} fixedGlass3H - 顶部中间固定部分玻璃高度(毫米)
     * @param {boolean} isTopTempered - 顶部是否钢化
     * @returns {Array} 玻璃列表
     */
    function getGlassList(glassType, sashGlassW, sashGlassH, fixedGlassW, fixedGlassH, 
                          fixedGlass2W, fixedGlass2H, fixedGlass3W, fixedGlass3H, isTopTempered) {
        let glassList = [];
        const isTempered = glassType.includes('Tmp');
        const tmprd = isTempered ? 'T' : '';
        const topTmprd = isTempered || isTopTempered ? 'T' : '';
        
        // Set Glass types based on selected glass type
        let type1, type2;
        if (glassType.includes('Clear/Clear')) {
            type1 = 'clear';
            type2 = 'clear';
        } else if (glassType.includes('Clear/Lowe2')) {
            type1 = 'clear';
            type2 = 'lowe2';
        } else if (glassType.includes('Clear/Lowe3')) {
            type1 = 'clear';
            type2 = 'lowe3';
        } else if (glassType.includes('OBS/Clear')) {
            type1 = 'OBS';
            type2 = 'clear';
        } else if (glassType.includes('OBS/Lowe2')) {
            type1 = 'OBS';
            type2 = 'lowe2';
        } else if (glassType.includes('OBS/Lowe3')) {
            type1 = 'OBS';
            type2 = 'lowe3';
        } else {
            // Default to Clear/Clear
            type1 = 'clear';
            type2 = 'clear';
        }
        
        // Sliding Sections (X) - There are two sliding sections (left and right) - Line 1
        glassList.push({
            line: 1,
            qty: 4, // 2 sliding sections × 2 panes of glass
            glassType: type1,
            tmprd: tmprd,
            thickness: '3',
            width: parseFloat(sashGlassW).toFixed(2),
            height: parseFloat(sashGlassH).toFixed(2)
        });
        
        if (type1 !== type2) {
            glassList.push({
                line: 1,
                qty: 4, // 2 sliding sections × 2 panes of glass
                glassType: type2,
                tmprd: tmprd,
                thickness: '3',
                width: parseFloat(sashGlassW).toFixed(2),
                height: parseFloat(sashGlassH).toFixed(2)
            });
        }
        
        // Fixed Section (O) in the middle - Line 2
        glassList.push({
            line: 2,
            qty: 2, // Middle fixed section × 2 panes of glass
            glassType: type1,
            tmprd: tmprd,
            thickness: '3',
            width: parseFloat(fixedGlassW).toFixed(2),
            height: parseFloat(fixedGlassH).toFixed(2)
        });
        
        if (type1 !== type2) {
            glassList.push({
                line: 2,
                qty: 2, // Middle fixed section × 2 panes of glass
                glassType: type2,
                tmprd: tmprd,
                thickness: '3',
                width: parseFloat(fixedGlassW).toFixed(2),
                height: parseFloat(fixedGlassH).toFixed(2)
            });
        }
        
        // Top Left/Right PP Sections - Line 3 (two equal panels on sides)
        glassList.push({
            line: 3,
            qty: 4, // 2 side PP sections × 2 panes of glass
            glassType: type1,
            tmprd: topTmprd,
            thickness: '3',
            width: parseFloat(fixedGlass2W).toFixed(2),
            height: parseFloat(fixedGlass2H).toFixed(2)
        });
        
        if (type1 !== type2) {
            glassList.push({
                line: 3,
                qty: 4, // 2 side PP sections × 2 panes of glass
                glassType: type2,
                tmprd: topTmprd,
                thickness: '3',
                width: parseFloat(fixedGlass2W).toFixed(2),
                height: parseFloat(fixedGlass2H).toFixed(2)
            });
        }
        
        // Top Middle PP Section - Line 4 (middle panel)
        glassList.push({
            line: 4,
            qty: 2, // 1 middle PP section × 2 panes of glass
            glassType: type1,
            tmprd: topTmprd,
            thickness: '3',
            width: parseFloat(fixedGlass3W).toFixed(2),
            height: parseFloat(fixedGlass3H).toFixed(2)
        });
        
        if (type1 !== type2) {
            glassList.push({
                line: 4,
                qty: 2, // 1 middle PP section × 2 panes of glass
                glassType: type2,
                tmprd: topTmprd,
                thickness: '3',
                width: parseFloat(fixedGlass3W).toFixed(2),
                height: parseFloat(fixedGlass3H).toFixed(2)
            });
        }
        
        return glassList;
    }

    /**
     * 处理网格计算并返回网格数据
     * @param {Object} windowData - 窗户数据
     * @param {number} sashGridW - 滑动部分网格宽度
     * @param {number} sashGridH - 滑动部分网格高度
     * @param {number} fixedGridW - 固定部分网格宽度
     * @param {number} fixedGridH - 固定部分网格高度
     * @param {number} fixedGrid2W - 顶部左右侧固定部分网格宽度
     * @param {number} fixedGrid2H - 顶部左右侧固定部分网格高度
     * @param {number} fixedGrid3W - 顶部中间固定部分网格宽度
     * @param {number} fixedGrid3H - 顶部中间固定部分网格高度
     * @returns {Object} 带有网格信息的窗户数据
     */
    function handleGridCalculations(windowData, sashGridW, sashGridH, fixedGridW, fixedGridH, 
                                   fixedGrid2W, fixedGrid2H, fixedGrid3W, fixedGrid3H) {
        const { grid, quantity } = windowData;
        let gridList = [];
        let lightCount = 0;
        let configTop = 'No Grid';
        let configMiddle = 'No Grid';
        let configBottom = 'No Grid';
        
        if (grid && grid !== 'None') {
            // Grid configuration based on window width
            let verticalDividers;
            if (windowData.widthMm <= 914.4) { // 36 inches
                verticalDividers = 1;
            } else if (windowData.widthMm <= 1524) { // 60 inches
                verticalDividers = 2;
            } else {
                verticalDividers = 3;
            }
            
            // Grid configuration based on window height
            let horizontalDividers;
            if (windowData.heightMm / 2 <= 609.6) { // 24 inches
                horizontalDividers = 1;
            } else {
                horizontalDividers = 2;
            }
            
            const gridLightsPerSection = (verticalDividers + 1) * (horizontalDividers + 1);
            const baseConfig = `${horizontalDividers + 1}x${verticalDividers + 1}`;
            
            if (grid === 'Standard') {
                lightCount = gridLightsPerSection * 5; // For all five sections (2 sliding, 1 fixed, 2 top PP panels)
                configTop = baseConfig;
                configMiddle = baseConfig;
                configBottom = baseConfig;
                
                // Add grids to the list
                // Sliding section grids (left and right)
                gridList.push({
                    section: 'sliding',
                    position: 'left-right',
                    width: sashGridW,
                    height: sashGridH,
                    type: 'standard',
                    qty: quantity * 2 // Two sliding sections
                });
                
                // Middle fixed section
                gridList.push({
                    section: 'fixed',
                    position: 'middle',
                    width: fixedGridW,
                    height: fixedGridH,
                    type: 'standard',
                    qty: quantity
                });
                
                // Top left/right PP sections
                gridList.push({
                    section: 'top-sides',
                    width: fixedGrid2W,
                    height: fixedGrid2H,
                    type: 'standard',
                    qty: quantity * 2 // Two side PP sections
                });
                
                // Top middle PP section
                gridList.push({
                    section: 'top-middle',
                    width: fixedGrid3W,
                    height: fixedGrid3H,
                    type: 'standard',
                    qty: quantity
                });
                
            } else if (grid === 'Marginal') {
                lightCount = gridLightsPerSection * 5 * 2; // Doubled for marginal grid
                configTop = `${baseConfig} Marginal`;
                configMiddle = configTop;
                configBottom = configTop;
                
                // Add grids to the list
                // Sliding section grids (left and right)
                gridList.push({
                    section: 'sliding',
                    position: 'left-right',
                    width: sashGridW,
                    height: sashGridH,
                    type: 'marginal',
                    qty: quantity * 4 // Two sliding sections, doubled for marginal
                });
                
                // Middle fixed section
                gridList.push({
                    section: 'fixed',
                    position: 'middle',
                    width: fixedGridW,
                    height: fixedGridH,
                    type: 'marginal',
                    qty: quantity * 2 // Doubled for marginal
                });
                
                // Top left/right PP sections
                gridList.push({
                    section: 'top-sides',
                    width: fixedGrid2W,
                    height: fixedGrid2H,
                    type: 'marginal',
                    qty: quantity * 4 // Two side PP sections, doubled for marginal
                });
                
                // Top middle PP section
                gridList.push({
                    section: 'top-middle',
                    width: fixedGrid3W,
                    height: fixedGrid3H,
                    type: 'marginal',
                    qty: quantity * 2 // Doubled for marginal
                });
                
            } else if (grid === 'Perimeter') {
                lightCount = gridLightsPerSection * 5; // For all five sections
                configTop = `${baseConfig} Perimeter`;
                configMiddle = configTop;
                configBottom = configTop;
                
                // Add grids to the list with perimeter type
                // Sliding section grids (left and right)
                gridList.push({
                    section: 'sliding',
                    position: 'left-right',
                    width: sashGridW,
                    height: sashGridH,
                    type: 'perimeter',
                    qty: quantity * 4 // Two sliding sections, specific for perimeter
                });
                
                // Middle fixed section
                gridList.push({
                    section: 'fixed',
                    position: 'middle',
                    width: fixedGridW,
                    height: fixedGridH,
                    type: 'perimeter',
                    qty: quantity // Single for middle section
                });
                
                // Top left/right PP sections
                gridList.push({
                    section: 'top-sides',
                    width: fixedGrid2W,
                    height: fixedGrid2H,
                    type: 'perimeter',
                    qty: quantity * 4 // Two side PP sections, specific for perimeter
                });
                
                // Top middle PP section
                gridList.push({
                    section: 'top-middle',
                    width: fixedGrid3W,
                    height: fixedGrid3H,
                    type: 'perimeter',
                    qty: quantity // Single for middle section
                });
            }
        }
        
        // Add grid information to window data
        windowData.gridList = gridList;
        windowData.lightCount = lightCount;
        windowData.configTop = configTop;
        windowData.configMiddle = configMiddle;
        windowData.configBottom = configBottom;
        
        return windowData;
    }

    /**
     * 计算Nailon类型的窗框
     * @param {number} widthMm - 窗户宽度(毫米)
     * @param {number} heightMm - 窗户高度(毫米)
     * @param {number} fixedHeightMm - 顶部固定部分高度(毫米)
     * @param {string} glassType - 玻璃类型
     * @param {Object} windowData - 窗户数据
     * @returns {Object} 处理后的窗户数据
     */
    function calculateNailon(widthMm, heightMm, fixedHeightMm, glassType, windowData) {
        // Frame dimensions
        const frameOutW = widthMm + 3 * 2;
        const frameOutH = heightMm + 3 * 2;
        const frameDayW = widthMm - 14 * 2 - 3 - 20;
        const frameDayH = heightMm - 64;
        
        // XOX section height (bottom part)
        const xoxSectionHeight = heightMm - fixedHeightMm;
        
        // Sash dimensions for sliding parts (X) - left and right
        const sashOutW = (widthMm / 4) - 14.5 - 15 + 1;
        const sashOutH = xoxSectionHeight - 6 - 46 - 15 - 3;
        
        // Screen dimensions (for sliding parts only)
        const screenW = (widthMm / 4) - 75 - 15 - 2;
        const screenH = xoxSectionHeight - 6 - 87 - 15 - 4;
        
        // Mullion dimensions
        const verticalMullion = xoxSectionHeight - 6 - 36 - 15;
        const verticalMullionAdjusted = verticalMullion - 2 * 25.4; // Convert from mm to inches
        const handlePosition = (xoxSectionHeight - 6 - 46 - 15) / 2 + 4 * 25.4; // Convert from mm to inches
        const horizontalTrack = widthMm - 14 * 2 - 15 * 2 - 3 - 20;
        
        // Cover dimensions for PP sections
        const coverWidth = (widthMm / 4) - 6 - 14 * 2 - 15 - 13;
        const coverHeight = fixedHeightMm - 6 - 14 * 2 - 22 * 2 - 15;
        
        // Big mullion dimensions
        const bigMullion = widthMm - 14 * 2 - 15 * 2 - 2 + 1.5;
        const bigMullion2 = fixedHeightMm - 6 - 14 * 2 - 15 - 2 + 1.5;
        
        // Glass dimensions
        // For sliding parts (X) - left and right
        const sashGlassW = widthMm / 4 - 77 - 15;
        const sashGlassH = heightMm - fixedHeightMm - 6 - 109 - 15 - 3 - 2;
        
        // For fixed part (O) in the middle
        const fixedGlassW = widthMm / 2 - 41.4;
        const fixedGlassH = heightMm - fixedHeightMm - 6 - 47 - 15 - 2;
        
        // For top PP parts - left and right
        const fixedGlass2W = widthMm / 4 - 6 - 20.5 * 2 - 3 * 2 - 15;
        const fixedGlass2H = fixedHeightMm - 6 - 20.5 * 2 - 3 * 2 - 15 - 2;
        
        // For top PP part - middle
        const fixedGlass3W = widthMm / 2 - 6 * 2 - 20.5 * 2 - 3 * 2;
        const fixedGlass3H = fixedHeightMm - 6 - 20.5 * 2 - 3 * 2 - 15 - 2;
        
        // Grid dimensions
        const sashGridW = round(sashGlassW - 18 - 2, 0);
        const sashGridH = round(sashGlassH - 18 - 2, 0);
        const fixedGridW = round(fixedGlassW - 18 - 2, 0);
        const fixedGridH = round(fixedGlassH - 18 - 2, 0);
        const fixedGrid2W = round(fixedGlass2W - 18 - 2, 0);
        const fixedGrid2H = round(fixedGlass2H - 18 - 2, 0);
        const fixedGrid3W = round(fixedGlass3W - 18 - 2, 0);
        const fixedGrid3H = round(fixedGlass3H - 18 - 2, 0);
        
        // Check if top is tempered
        const isTopTempered = windowData.topBottom === 'Tempered';
        
        // Process glass list
        const glassList = getGlassList(
            glassType, 
            sashGlassW, 
            sashGlassH, 
            fixedGlassW, 
            fixedGlassH, 
            fixedGlass2W, 
            fixedGlass2H, 
            fixedGlass3W, 
            fixedGlass3H,
            isTopTempered
        );
        
        // Process grid calculations
        windowData = handleGridCalculations(
            windowData,
            sashGridW,
            sashGridH,
            fixedGridW,
            fixedGridH,
            fixedGrid2W,
            fixedGrid2H,
            fixedGrid3W,
            fixedGrid3H
        );
        
        // Update window data with calculated dimensions
        windowData.frameOutW = frameOutW;
        windowData.frameOutH = frameOutH;
        windowData.frameDayW = frameDayW;
        windowData.frameDayH = frameDayH;
        windowData.sashOutW = sashOutW;
        windowData.sashOutH = sashOutH;
        windowData.screenW = screenW;
        windowData.screenH = screenH;
        windowData.verticalMullion = verticalMullion;
        windowData.verticalMullionAdjusted = verticalMullionAdjusted;
        windowData.handlePosition = handlePosition;
        windowData.horizontalTrack = horizontalTrack;
        windowData.coverWidth = coverWidth;
        windowData.coverHeight = coverHeight;
        windowData.bigMullion = bigMullion;
        windowData.bigMullion2 = bigMullion2;
        windowData.glassList = glassList;
        
        return windowData;
    }

    /**
     * 计算其他类型的窗框(Retrofit, Block, Block-slop)
     * @param {number} widthMm - 窗户宽度(毫米)
     * @param {number} heightMm - 窗户高度(毫米)
     * @param {number} fixedHeightMm - 顶部固定部分高度(毫米)
     * @param {string} frame - 窗框类型
     * @param {string} glassType - 玻璃类型
     * @param {Object} windowData - 窗户数据
     * @returns {Object} 处理后的窗户数据
     */
    function calculateOtherFrames(widthMm, heightMm, fixedHeightMm, frame, glassType, windowData) {
        // Frame dimensions
        const frameOutW = widthMm + 3 * 2;
        const frameOutH = heightMm + 3 * 2;
        let frameDayW, frameDayH;
        
        // Adjust calculations based on frame type
        if (frame === 'Retrofit') {
            frameDayW = widthMm - 14 * 2 - 3 - 20;
            frameDayH = heightMm - 69;
        } else { // Block or Block-slop
            frameDayW = widthMm - 14 * 2 - 3 - 20;
            frameDayH = heightMm - 69;
        }
        
        // XOX section height (bottom part)
        const xoxSectionHeight = heightMm - fixedHeightMm;
        
        // Sash dimensions for sliding parts (X) - left and right
        const sashOutW = (widthMm / 4) - 14.5 + 1;
        const sashOutH = xoxSectionHeight - 6 - 46 - 3;
        
        // Screen dimensions (for sliding parts only)
        const screenW = (widthMm / 4) - 75 - 2;
        const screenH = xoxSectionHeight - 6 - 87 - 4;
        
        // Mullion dimensions
        const verticalMullion = xoxSectionHeight - 6 - 36;
        const verticalMullionAdjusted = verticalMullion - 2 * 25.4; // Convert from mm to inches
        const handlePosition = (xoxSectionHeight - 6 - 46) / 2 + 4 * 25.4; // Convert from mm to inches
        const horizontalTrack = widthMm - 14 * 2 - 3 - 20;
        
        // Cover dimensions for PP sections
        const coverWidth = (widthMm / 4) - 6 - 14 * 2 - 13;
        const coverHeight = fixedHeightMm - 6 - 14 * 2 - 22 * 2;
        
        // Big mullion dimensions
        const bigMullion = widthMm - 14 * 2 - 2 + 1.5;
        const bigMullion2 = fixedHeightMm - 6 - 14 * 2 - 2 + 1.5;
        
        // Slop dimension for Block-slop frame
        let slop = 0;
        if (frame === 'Block-slop') {
            slop = (widthMm - 10) / 25.4;
        }
        
        // Glass dimensions
        // For sliding parts (X) - left and right
        const sashGlassW = widthMm / 4 - 77;
        const sashGlassH = heightMm - fixedHeightMm - 6 - 109 - 3 - 2;
        
        // For fixed part (O) in the middle
        const fixedGlassW = widthMm / 2 - 41.4;
        const fixedGlassH = heightMm - fixedHeightMm - 6 - 47 - 2;
        
        // For top PP parts - left and right
        const fixedGlass2W = widthMm / 4 - 6 - 20.5 * 2 - 3 * 2;
        const fixedGlass2H = fixedHeightMm - 6 - 20.5 * 2 - 3 * 2 - 2;
        
        // For top PP part - middle
        const fixedGlass3W = widthMm / 2 - 6 * 2 - 20.5 * 2 - 3 * 2;
        const fixedGlass3H = fixedHeightMm - 6 - 20.5 * 2 - 3 * 2 - 2;
        
        // Grid dimensions
        const sashGridW = round(sashGlassW - 18 - 2, 0);
        const sashGridH = round(sashGlassH - 18 - 2, 0);
        const fixedGridW = round(fixedGlassW - 18 - 2, 0);
        const fixedGridH = round(fixedGlassH - 18 - 2, 0);
        const fixedGrid2W = round(fixedGlass2W - 18 - 2, 0);
        const fixedGrid2H = round(fixedGlass2H - 18 - 2, 0);
        const fixedGrid3W = round(fixedGlass3W - 18 - 2, 0);
        const fixedGrid3H = round(fixedGlass3H - 18 - 2, 0);
        
        // Check if top is tempered
        const isTopTempered = windowData.topBottom === 'Tempered';
        
        // Process glass list
        const glassList = getGlassList(
            glassType, 
            sashGlassW, 
            sashGlassH, 
            fixedGlassW, 
            fixedGlassH, 
            fixedGlass2W, 
            fixedGlass2H, 
            fixedGlass3W, 
            fixedGlass3H,
            isTopTempered
        );
        
        // Process grid calculations
        windowData = handleGridCalculations(
            windowData,
            sashGridW,
            sashGridH,
            fixedGridW,
            fixedGridH,
            fixedGrid2W,
            fixedGrid2H,
            fixedGrid3W,
            fixedGrid3H
        );
        
        // Update window data with calculated dimensions
        windowData.frameOutW = frameOutW;
        windowData.frameOutH = frameOutH;
        windowData.frameDayW = frameDayW;
        windowData.frameDayH = frameDayH;
        windowData.sashOutW = sashOutW;
        windowData.sashOutH = sashOutH;
        windowData.screenW = screenW;
        windowData.screenH = screenH;
        windowData.verticalMullion = verticalMullion;
        windowData.verticalMullionAdjusted = verticalMullionAdjusted;
        windowData.handlePosition = handlePosition;
        windowData.horizontalTrack = horizontalTrack;
        windowData.coverWidth = coverWidth;
        windowData.coverHeight = coverHeight;
        windowData.bigMullion = bigMullion;
        windowData.bigMullion2 = bigMullion2;
        windowData.slop = slop;
        windowData.glassList = glassList;
        
        return windowData;
    }

    /**
     * 处理窗户数据并计算尺寸
     * @param {Object} windowData - 窗户数据对象
     * @returns {Object} 处理后的窗户数据
     */
    function processWindowData(windowData) {
        const { width, height, fixedHeight, frame, glassType, quantity, topBottom } = windowData;
        
        // 将英寸转换为毫米
        const widthMm = width * 25.4;
        const heightMm = height * 25.4;
        const fixedHeightMm = fixedHeight * 25.4;
        
        // 更新windowData对象
        windowData.widthMm = widthMm;
        windowData.heightMm = heightMm;
        windowData.fixedHeightMm = fixedHeightMm;
        windowData.quantity = quantity || 1;
        windowData.topBottom = topBottom || 'Regular';
        
        // 根据框架类型执行不同的计算
        if (frame === 'Nailon') {
            return calculateNailon(widthMm, heightMm, fixedHeightMm, glassType, windowData);
        } else {
            return calculateOtherFrames(widthMm, heightMm, fixedHeightMm, frame, glassType, windowData);
        }
    }

    // 注册窗口类型处理程序
    abstractWindow.registerWindowHandler('XOX-PPP', processWindowData);

    return {
        processWindowData: processWindowData
    };
}); 