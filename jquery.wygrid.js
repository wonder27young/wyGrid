/*
* wyGrid 0.1
* Copyright (c) 2014 wy personal
* Date: 2014-02-14
* Author: wy 
* Email: wonder27young@163.com
* 使用wyGrid可以方便地将表格提示使用体验。先提供的功能有奇偶行颜色交替，前台排序，列移动，选择行，鼠标移上高亮显示
* 
*/
(function ($) {
    $.fn.wyGrid = function (options) {
        var defaults = {
            evenRowClass: "TableLine1",
            oddRowClass: "TableLine2",
            activeRowClass: "activeRow",
            urlPath: "",
            pageSize: 10,
            allowPaging: true,
            allowSelected: true,
            allowFixTableHeader: false,
            allowDisabledPageSize: false,
            allowAjax: false,
            allowAutoSearch: false,
            funcAjaxCallBack: null,
            entityName: "EntityName",
            searchOption: {
                formID: "form",
                searchID: "btnSearch",
                searchPath: "",
                searchResult: false,
    },
    };
        options = $.extend(defaults, options);
        var indexInfo = {
            /* EntityName: "EntityInfo",*/
            EntityName: options.entityName,
            PageSize: options.pageSize,
            CurPage: 0,
            FirstPage: 0,
            LastPage: 0,
            NextPage: 0,
            PrevPage: 0,
            TotalPage: 0,
            TotalCount: 0,
            AllowAjax: options.allowAjax,
            UrlPath: options.urlPath,
        };
        var thisObj = $(this);
        var dataAjaxCallBack=function() {
            
        }
        this.each(function () {
            var thisTable = $(this);
            var isInit = $(this).attr("isInit");
            if (isInit == undefined) {
                $(this).attr("isInit", false);
                isInit = $(this).attr("isInit");
            }
            if (isInit=="false") {
                initGridHeader(thisTable);
                initGridDataStyle(thisTable);
                initGridData(thisTable);
                if (options.allowPaging) {
                    initGridPaging(thisTable);
                }
                if (options.allowSelected) {
                    initHeaderSelected(thisTable);
                }
                if (options.allowAutoSearch) {
                    initHeaderSearch(thisTable);
                }
                $(this).attr("isInit", true);
            }
            if (options.allowAjax == true) {
                dataAjaxCallBack = options.funcAjaxCallBack;
                initListData();
                return;
            } else {
                initContent(thisTable);
            }
           
        });
        function initContent(thisTable) {

            if (options.allowSelected) {
                initContentSelected(thisTable);
            }
            if (options.allowPaging) {
                if (options.allowAjax == false||options.searchOption.searchResult) {
                    indexInfo.TotalCount = $(thisObj).find("tr").size() - 1;
                }
                if (indexInfo.CurPage == 0) {
                    indexInfo.CurPage = 1;
                }
                setPageInfo(indexInfo.CurPage);
            }
            initContentDataStyle(thisTable);

        }
        function initHeaderSelected(obj) {
            //edit by wy 添加选择列
            var dataList = $(obj);
            var firstTh = dataList.find("tr:first th:first");
            firstTh.before('<th width="40" align="center"><input type="checkbox" id="selAll" name="selRecordAll" class="selAll"></th>');
            dataList.find(".selAll").on("click", function () {
                var check = $(this).attr("checked") == undefined ? false : $(this).attr("checked");
                dataList.find("input[name='selRecord']:not(:hidden)").attr("checked", check);
            });           
        }
        function initHeaderSearch(obj) {
            $("#"+options.searchOption.searchID).click(function () {
                var da = $("#" + options.searchOption.formID).serialize();
                var keys = da.split('&');
                var flags = [];
                for (var i = 0; i < keys.length; i++) {
                    var paras = keys[i].split('=');
                    if (paras.length == 2 && paras[1] != "") {
                        flags.push(paras[0]);
                    }
                }
                if (flags.indexOf("SearchFlag") > -1) {
                    flags.pop("SearchFlag");
                }
                $("#SearchFlag").val(flags.join(','));
                var data = $("#" + options.searchOption.formID).serialize();
                var index = $.param(indexInfo);
                $.ajax({
                    type: 'post',
                    url: options.searchOption.searchPath, //路径为添加方法
                    data: data +"&"+index ,
/*                    data: data, //参数的个数和名字要和方法的名字保持一致*/
                    success: function (msg) //返回的是Json类型的
                    {
                        dataAjaxCallBack(msg.Data);
                        indexInfo.TotalCount = msg.IndexInfo.TotalCount;
                        indexInfo.CurPage = msg.IndexInfo.CurPage;
                        options.searchOption.searchResult = true;
                        initContent(thisObj);
                        gotoViewPage(indexInfo.CurPage);
                        
                    }
                });
            });


        }
        function initContentSelected(dataList) {
            dataList.find("tr:not(:first)").find("td:first").each(function () {
                var myID = $(this).next().text();
                $(this).attr("value", myID);
                $(this).before('<td align="center"><input type="checkbox" id="sel_' + myID + '" value="' + myID + '" name="selRecord"></td>');
            });
            var selAllLen = dataList.find("input[name='selRecord']:not(:hidden)").length;
            dataList.find("input[name='selRecord']").on("click", function () {
                var sel_len = dataList.find("input[name='selRecord'][checked]:not(:hidden)").length;
                if (sel_len == selAllLen) {
                    dataList.find(".selAll").attr("checked", true);
                } else {
                    dataList.find(".selAll").attr("checked", false);
                }
            });
        }
        function initGridHeader(obj) {
            //edit by wy 固定表头
            fixTableHeader(obj, 0);

        }


        function initGridDataStyle(obj) {
            //edit by wy 添加table样式
            var dataList = $(obj);
            //添加奇偶行颜色
            dataList.find("tr:even").addClass(options.evenRowClass);
            dataList.find("tr:odd").addClass(options.oddRowClass);
            //添加活动行颜色
            dataList.find("tr").on("mouseover", function () {
                $(this).addClass(options.activeRowClass);
            });
            dataList.find("tr").on("mouseout", function () {
                $(this).removeClass(options.activeRowClass);
            });

            var trs = dataList.find("tr");
            $(trs[0]).attr("id", "tableTr");
            var tds = $(".TableHeader").find("th");
            for (i = 0; i < tds.length; i++) {
                var re = '<span class="resizeDivClass" style="cursor: e-resize;">&nbsp</span>';
                var text = $(tds[i]).text();
                var link = '<a index="' + i + '" href="javascript:;">' + text + '</a>';
                $(tds[i]).html("");
                $(tds[i]).append(re);
                $(tds[i]).append(link);
            }
/*            var cloneTable = jQuery("#clone_table");
            var ths = cloneTable.find("th");
            for (i = 0; i < ths.length; i++) {
                var re = '<span class="resizeDivClass" style="cursor: e-resize;">&nbsp</span>';
                var text = $(ths[i]).text();
                var link = '<a href="javascript:;">' + text + '<img src="/Css/images/order_down.png"></a>';
                $(ths[i]).html("");
                $(ths[i]).append(re);
                $(ths[i]).append(link);
            }*/
        }

        function initContentDataStyle(obj) {
            //edit by wy 添加table样式
            var dataList = $(obj);
            //添加奇偶行颜色
            dataList.find("tr:even").addClass(options.evenRowClass);
            dataList.find("tr:odd").addClass(options.oddRowClass);
        }


        function initColSort() {
            $(".TableHeader").find("a").on("click", function () {
                var dataType = "";
                if ($(this).text() == "序号")
                    dataType = 'int';
                tabSor(thisObj.attr("id"), $(this).parent().index(), dataType);
                changePaging(indexInfo.CurPage);
                //重新上色
                var dataList = $(thisObj);
                //添加奇偶行颜色
                dataList.find("tr").removeClass(options.evenRowClass);
                dataList.find("tr").removeClass(options.oddRowClass);
                dataList.find("tr:even").addClass(options.evenRowClass);
                dataList.find("tr:odd").addClass(options.oddRowClass);
            });
        }

        function fixTableHeader(gv, scrollHeight) {
            var isHeight = (scrollHeight > 0);
            var content = "<div id='" + $(gv).attr('id') + "_cont' style='";
            if (isHeight) {
                content += "height:" + scrollHeight + "px; overflow-y: scroll;";
            }
            content += "overflow-x:scroll; padding: 0;margin: 0;'></div>";
            /*$(gv).wrap("<div id='" + $(gv).attr('id') + "_cont" + "' style='height:" + scrollHeight + "px; overflow-y: scroll;overflow-x:hidden; overflow: auto; padding: 0;margin: 0;'></div>");*/
            $(gv).wrap(content);
            $(gv).addClass("CRM_TableList");
            $(gv).find("tr:first").addClass("TableHeader");
            var gvn = $(gv).clone(true).removeAttr("id");
            $(gvn).find("tr:not(:first)").remove();
            $(gvn).attr("id", $(gv).attr('id') + "_clone");
            $(gvn).css("table-layout", "fixed");
            if (options.allowFixTableHeader) {
                $(gv).before(gvn);
                $(gvn).wrap("<div class='sHeader' style='width:100%'></div>");
                $(gv).parent().scroll(function () {
                    $(".sHeader").css("left", $(this).scrollLeft() * -1);
                });
            }


            /*            $(gv).find("tr:first th").each(function () {
            var index = $(this).index();
            $(this).parent().parent().next().find("tr:first th:eq(" + index + ")").width($(this).css("width"));
            })*/
            //$(gv).find("tr:first").remove();

        }
        function initGridData(obj) {
            var dataList = $(obj);
            var h = dataList.height() + 18;
            jQuery('div.sData').height(h);
            jQuery('#datalist_box').add('#datalist_recycle_box').height(h);
            dataList.css("table-layout", "fixed");
            var obj = new Object;
            obj.mouseDownX = "";
            obj.pareneTdW = "";
            obj.pareneTableW = "";
            obj.eventBinded = false;
            jQuery("span[class='resizeDivClass']").css("cursor", "e-resize").on("mousedown", resizeStart);
            /*jQuery(window).add("span[class='resizeDivClass']").on("mouseup", resizeEnd);*/
            jQuery("span[class='resizeDivClass']").on("mouseup", resizeEnd);
            initColSort();
            typeof initListDataCallback == 'function' && initListDataCallback();
        }
        function initGridPaging() {
            //initPagingData
            indexInfo.TotalCount = $(thisObj).find("tr").size() - 1; //减掉Header行
            setPageInfo(1);
            //show and hide
            /*            $(thisObj).find("tr:gt(" + indexInfo.PageSize + ")").hide();
            if (indexInfo.PageSize == "0") {
            indexInfo.TotalPage = indexInfo.TotalCount;
            } else {
            indexInfo.TotalPage = Math.floor((indexInfo.TotalCount - 1 + indexInfo.PageSize) / indexInfo.PageSize);
            }
            indexInfo.FirstPage = indexInfo.TotalPage > 0 ? 1 : 0;
            indexInfo.PrevPage = indexInfo.CurPage > 0 ? indexInfo.CurPage - 1 : 0;
            indexInfo.NextPage = indexInfo.CurPage < indexInfo.TotalPage ? indexInfo.CurPage + 1 : indexInfo.TotalPage;
            indexInfo.LastPage = indexInfo.TotalPage > 0 ? indexInfo.TotalPage - 1 : 0;*/
            var pageTableId = thisObj.attr('id') + "_Pageing";
            var content = "<div id='" + pageTableId + "' style='float: right; margin-right: 15px;'>";
            var selectPageSize = "";
            if (options.allowDisabledPageSize) {

                selectPageSize = '<select class="PageSize" style="font-size: 11px;"' + "disabled=" + options.allowDisabledPageSize + '>' +
                    '<option value="' + options.pageSize + '">' + options.pageSize + '</option>' +
                    '</select>';
            } else {
                selectPageSize = '<select class="PageSize" style="font-size: 11px;">' +
                    '<option value="10">10</option>' +
                    '<option value="20">20</option>' +
                    '<option value="25">25</option>' +
                    '<option value="50">50</option>' +
                    '<option value="150">150</option>' +
                    '</select>';
            }
            var table =
                '<table width="400px" cellspacing="0" cellpadding="0" class="page_bar">' +
                    '<tbody>' +
                        '<tr>' +
                            '<td class="page_bar_bg">' +
                                '第<span class="CurPage">' + indexInfo.FirstPage + '</span>/<span class="TotalPage">' + indexInfo.TotalPage + '</span>页<span title="首页" href="#" class="FirstPage">' +
                                    '&nbsp;&nbsp;&nbsp;&nbsp;</span> <span title="上一页" href="#" class="PrevPage">' +
                                        '&nbsp;&nbsp;&nbsp;&nbsp;</span> <span title="下一页" href="#" class="NextPage">' +
                                            '&nbsp;&nbsp;&nbsp;&nbsp;</span> <span title="末页" href="#" class="LastPage">' +
                                                '&nbsp;&nbsp;&nbsp;&nbsp;</span>共' + '<span class="TotalCount">' + indexInfo.TotalCount + '</span>' + '条&nbsp;每页' +
                                                selectPageSize +
                                '条&nbsp;第&nbsp;<input type="text" onkeydown="jumpPage(this,event,1);" class="efViewTextBox"' +
                                    'style="width: 30px; height: 16px;" id="jumpPage" name="jumpPage">&nbsp;页' +
                                '<img title="跳转" onclick="gotoViewPage(jQuery(this).parent().find(\'#jumpPage\').val());"' +
                                    'class="PagingGo">';
            '</td></tr></tbody></table>';
            content += table + "</div>";
            /*thisObj.parent().parent().append(content);*/
            thisObj.parent().parent().append(content);
            $("#" + pageTableId + " .FirstPage").on("click", function () {
                gotoViewPage(indexInfo.FirstPage);
            });
            $("#" + pageTableId + " .LastPage").on("click", function () {
                gotoViewPage(indexInfo.LastPage);
            });
            $("#" + pageTableId + " .PrevPage").on("click", function () {
                gotoViewPage(indexInfo.PrevPage);
            });
            $("#" + pageTableId + " .NextPage").on("click", function () {
                gotoViewPage(indexInfo.NextPage);
            });
            selectValue($("#" + pageTableId + " .PageSize"), indexInfo.PageSize);
            $("#" + pageTableId + " .PageSize").each(function () {
                $(this).change(function () {
                    pageSizeSet(this.value);
                });
            });


        }

        function selectValue(obj, value) {
            //添加如果不在当前集合内则插入一条记录
            var s = obj;
            var isInOptions = false;
            s.find("option").each(function () {
                if ($(this).attr("value") == value) {
                    $(this).attr("selected", "true");
                    isInOptions = true;
                }
            });
            if (!isInOptions) {
                s.append('<option value="' + value + '">' + value + '</option>');
                selectValue(obj, value);
            }

        }

        function resizeStart(e) {
            obj = $(this);
            if (this.setCapture) {
                this.setCapture();
            } else if (window.captureEvents) {
                window.captureEvents(Event.MOUSEMOVE | Event.MOUSEUP | Event.MOUSEDOWN);
            }
            jQuery(document.body).attr("unselectable", "on").on("selectstart", function () {
                return false;
            }).css({ "-moz-user-select": "none", cursor: 'e-resize' });
            jQuery(this).parent('tr').css('cursor', 'e-resize');
            var pageX = e.originalEvent.x || e.originalEvent.layerX || 0;
            var pageY = e.originalEvent.y || e.originalEvent.layerY || 0;
            obj.mouseDownX = pageX;
            obj.mouseDownY = pageY;
            obj.pareneTdW = jQuery(this).parent().width();
            obj.pareneTableW = jQuery("#clone_table").width();
            obj.handle = this;
            !obj.eventBinded && jQuery(this).parents('tr:first').add("span[class='resizeDivClass']").on("mousemove", resizing);
            obj.eventBinded = true;
        }

        function resizing(e) {
            var pageX = e.originalEvent.x || e.originalEvent.layerX || 0;
            var pageY = e.originalEvent.y || e.originalEvent.layerY || 0;

            if (!obj.mouseDownX) {
                return false;
            }
            var newWidth = obj.pareneTdW + pageX - obj.mouseDownX;

            if (newWidth > 60) {
                jQuery(obj.handle).parent().css("width", newWidth);
                jQuery("#tableTr > th:eq(" + jQuery(obj.handle).parent().index() + ")").width(newWidth);
            }
        }
        function resizeEnd(e) {
            obj = $(this);
            if (this.releaseCapture) {
                this.releaseCapture();
            } else if (window.releaseEvents) {
                window.releaseEvents(Event.MOUSEMOVE | Event.MOUSEUP | Event.MOUSEDOWN);
            }
            obj.eventBinded && jQuery(this).parents('tr:first').add("span[class='resizeDivClass']").off("mousemove");
            obj.eventBinded = false;
            obj.mouseDownX = 0;

            jQuery(document.body).attr("unselectable", "").off("selectstart").css({ "-moz-user-select": "", cursor: "auto" });
            jQuery(this).parent('tr').css('cursor', 'auto');
        }
        function initListData() {
            getListInfo(indexInfo);            
        }
        function getListInfo(_datas) {
            //var loading = jQuery('#data_loading');
            //loading.show();
            var url = options.urlPath;
            var _datas = _datas || {}; 
            jQuery.ajax({
                type: "post",
                data: _datas,
                url: url,
                success: function (msg) {
                    dataAjaxCallBack(msg.Data);
                    indexInfo.TotalCount = msg.IndexInfo.TotalCount;
                    indexInfo.CurPage = msg.IndexInfo.CurPage;
                    initContent(thisObj);                                        
                }
            });
        }
        function replaceUrlQueryString(url, name, value) {
            var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
            var r = url.substr(1).match(reg);
            if (r != null) {
                url = url.substr(1).replace(name + "=" + r[2] + r[3], name + "=" + value + r[3]);
            } else {
                if (url.length > 1) {
                    url = url.substr(1) + "&" + name + "=" + value;
                } else {
                    url = name + "=" + value;
                }
            }
            return url;
        }
        function jumpPage(obj, event, totalPage) {//分页跳转-未实现
            if (event.keyCode == 13) {
                var objValue = obj.value;
                var re = /^[0-9]+$/;
                if (!(re.test(objValue))) {
                    alert(td_lang.crm.inc.msg_26);
                    obj.value = "";
                    return false;
                }
                if (objValue <= 0 || objValue > totalPage) {
                    alert(sprintf(td_lang.crm.inc.msg_27, totalPage));
                    obj.value = "";
                    return false;
                }
                gotoViewPage(objValue);
            }
        }
        function gotoViewPage(page) {
            var url = window.location.search;
            if (typeof indexInfo == 'undefined' || typeof getListInfo == 'undefined') {
                url = replaceUrlQueryString(url, "CurPage", page);
                if (url.indexOf("?") == -1) {
                    this.document.location.href = window.location.pathname + "?" + url;
                } else {
                    this.document.location.href = window.location.pathname + url;
                }
            } else {
                indexInfo.CurPage = page;
                if (indexInfo.AllowAjax && (options.searchOption.searchResult==undefined||options.searchOption.searchResult == false)) {
                    //后台分页
                    getListInfo(indexInfo);
                } else {
                    //前台分页
                    changePaging(page);
                }
            }
        }
        function changePaging(page) {

            setPageInfo(page);
            thisObj.find("tr:not(:first)").hide();
            var startN = (indexInfo.CurPage > 0 ? indexInfo.CurPage - 1 : 0) * indexInfo.PageSize + 1;
            var endN = startN + indexInfo.PageSize;
            thisObj.find("tr").each(function () {
                if ($(this).index() >= startN && $(this).index() < endN) {
                    $(this).show();
                }
            });
            if (options.allowSelected) {
                initCheckAll();
            }
        }

        function setPageInfo(page) {
            indexInfo.CurPage = page;
            if (indexInfo.PageSize == "0") {
                indexInfo.TotalPage = indexInfo.TotalCount;
            } else {
                indexInfo.TotalPage = Math.floor((indexInfo.TotalCount - 1 + indexInfo.PageSize) / indexInfo.PageSize);
            }
            indexInfo.FirstPage = indexInfo.TotalPage > 0 ? 1 : 0;
            indexInfo.LastPage = indexInfo.TotalPage > 0 ? indexInfo.TotalPage : 0;
            if (indexInfo.TotalCount > 0) {
                indexInfo.PrevPage = indexInfo.CurPage > 1 ? indexInfo.CurPage - 1 : 1;
            } else {
                indexInfo.CurPage = 0;
                indexInfo.PrevPage = 0;
            }
            var pageTableId = thisObj.attr('id') + "_Pageing";
            $("#" + pageTableId + " .CurPage").text(indexInfo.CurPage);
            $("#" + pageTableId + " .TotalPage").text(indexInfo.TotalPage);
            $("#" + pageTableId + " .TotalCount").text(indexInfo.TotalCount);
            indexInfo.NextPage = indexInfo.CurPage < indexInfo.TotalPage ? indexInfo.CurPage + 1 : indexInfo.TotalPage;
        }
        function initCheckAll() {
            var dataList = thisObj;
            var selAllLen = dataList.find("input[name='selRecord']:not(:hidden)").length;
            var selLen = dataList.find("input[name='selRecord'][checked]:not(:hidden)").length;
            if (selLen == selAllLen) {
                dataList.find(".selAll").attr("checked", true);
            } else {
                dataList.find(".selAll").attr("checked", false);
            }
        }
        function pageSizeSet(num) {
            if (typeof indexInfo == 'undefined' || typeof getListInfo == 'undefined') {
                var url = window.location.search;
                url = replaceUrlQueryString(url, "PAGE_SIZE", num);
                if (url.indexOf("?") == -1) {
                    this.document.location.href = window.location.pathname + "?" + url;
                } else {
                    this.document.location.href = window.location.pathname + url;
                }
            } else {
                indexInfo.PageSize = Number(num);
                indexInfo.CurPage = 1;
                gotoViewPage(indexInfo.CurPage);
                //getListInfo(indexInfo);
            }
        }
        /*function funcAjaxCallBack(data) {
            var trs = $("#product_template").render(data);
            $("#gvPhaseAnalysis tr:not(:first)").remove();
            $("#gvPhaseAnalysis tr:first").after(trs);
        }*/
        function convert(sValue, sDataType) { //类型转，根据不同类型数据排序，比如，整型，日期，浮点，字符串，接受两个参数，一个是值，一个是排序的数据类型  
            switch (sDataType) {
                case "int":
                    return parseInt(sValue);
                case "float":
                    return parseFloat(sValue);
                case "date":
                    return new Date(Date.parse(sValue));
                default:
                    return sValue.toString();
            }
        }
        function geterateCompareTRs(iCol, sDataType) { //比较函数，用于sort排序用  
            return function compareTRs(oTR1, oTR2) {
                var vValue1,
                    vValue2;
                if (oTR1.cells[iCol].getAttribute("value")) { //用于高级排序，比如图片，添加一个额外的属性来排序  
                    vValue1 = convert(oTR1.cells[iCol].getAttribute("value"), sDataType);
                    vValue2 = convert(oTR2.cells[iCol].getAttribute("value"), sDataType);
                } else {
                    if (oTR1.cells[iCol].firstChild != null && oTR2.cells[iCol].firstChild != null) {
                        vValue1 = convert(oTR1.cells[iCol].firstChild.nodeValue, sDataType);
                        vValue2 = convert(oTR2.cells[iCol].firstChild.nodeValue, sDataType);
                    } else {
                        return 0;
                    }

                }
                if (vValue1 < vValue2) {
                    return -1;
                } else if (vValue1 > vValue2) {
                    return 1;
                } else {
                    return 0;
                }
            };
        }
        function tabSor(sTableID, iCol, sDataType) { //排序函数，sTableID为目标,iCol哪列排序，为必需，sDataType可选  
            var oTable = document.getElementById(sTableID);
            var oTBody = oTable.tBodies[0];
            var colDataRows = oTBody.rows;
            var headRow = oTBody.rows[0];
            headRow.remove();
            var aTRs = [];
            for (var i = 0; i < colDataRows.length; i++) {
                aTRs[i] = colDataRows[i];
            };
            if (oTable.sortCol == iCol) { //如果已经排序，则倒序  
                aTRs.reverse();
            } else {
                aTRs.sort(geterateCompareTRs(iCol, sDataType));
            }
            var oFragment = document.createDocumentFragment();
            oFragment.appendChild(headRow);
            for (var j = 0; j < aTRs.length; j++) {
                oFragment.appendChild(aTRs[j]);
            };
            oTBody.appendChild(oFragment);
            oTable.sortCol = iCol; //设置一个状态
        }
    };

})(jQuery); 