(function (factory) {
    var global = typeof window != 'undefined' ? window : this;

    if (typeof module === "object" && typeof module.exports === "object") {
        module.exports = global.document ? factory(global) : function(win) {
            if (!win.document)throw new Error("document is a undefined");
            return factory(win);
        };
    } else {
        factory(global);
    }

}(function (window) {

    var mNow = 0,       // 当前相对月份
        yNow = 0,       // 当前相对年份
        silde = false;  // 日历列表正在滑动
    
    var oCalenWrap = create('div', {"class" : 'calendar'}),           // 最大父级
        oCalen = create('div', {"class" : 'calendar-content'}),       // 日历box
        calendarWeek = create('div', {"class" : 'calendar-week'}),    //日历星期
        calendarList = create('div', {"class" : 'calendar-list'}),    // 日历列表

        past,           // 过去的时间是否可选
        calenTitles,    // 年，月标题
        aMonths,        // 可以选择的所有月份
        aYears,         // 可以选择的所有年份
        yearTitle,      // 当前年标题
        monthTitle,     // 当前月标题
        prevYearBtn,    // 上一年
        nextYearBtn,    // 下一年
        prevMonthBtn,   // 上个月
        nextMonthBtn,   // 下个月
        selectYearBox,  // 年份选择
        selectMonthBox; // 月份选择

    function Calendar(){
        var oDate       = new Date();
        this.toogle     = false;         //可否切换日历周历
        this.hours      = false;
        this.hoursPast  = false;
        this.focusObj   = null;
        this.shield     = '[]';
        this.startDate  = '';
        this.startJSON  = {};
        this.fixDate    = {y : oDate.getFullYear(), m : oDate.getMonth() + 1, d : 0};

        // 开始初始化
        this.init();
    }

    // 初始化
    Calendar.prototype.init = function(){
        var $this = this;

        var aCalendar = getElement(document, '#aCalendar');
        if(!aCalendar) return false;

        aCalendar.appendChild(oCalenWrap);
        oCalenWrap.appendChild(oCalen);
        calenHeader = getElement(oCalen, '.calendar-header');
        calenTitle = getElement(oCalen, '.calendar-title');

        // 创建头部
        this.createHeader(function(){
            // 创建星期标题头
            $this.createWeek();

            oCalen.appendChild(calendarList);

            $this.toggle = attr(aCalendar, 'toggle') == 'true'?true:false;
            //按钮切换日历和周历 
            if($this.toggle){
                // 创建收缩底部
                $this.createWeeklist();

                sildeSwitch(calendarWeeklist, function(obj, dir ,dir2){
                    if(dir==0&&dir2>0){
                        toolClass(calendarList, 'close','remove');
                        toolClass(calendarWeeklist, 'close','add');
                        
                    }
                    if(dir2==0){
                       dir > 0 ? mNow-- : mNow++;
                       // 左右切换周历
                       console.log(dir);
                       $this.transitionsWeek(obj, dir); 
                    }
                });
            }
            
            // 滑动切换上下月
            sildeSwitch(calendarList, function(obj, dir ,dir2){
                // debugger;
                if($this.toggle&&dir==0&&dir2<0){
                    toolClass(calendarList, 'close','add');
                    toolClass(calendarWeeklist, 'close','remove');
                }
                if(dir2==0){
                   dir > 0 ? mNow-- : mNow++;
                   $this.startJSON.prev.m = mNow - 1;
                   $this.startJSON.now.m = mNow;
                   $this.startJSON.next.m = mNow + 1;
                   $this.transitions(obj, dir); 
                }
            });

        });


        // 显示日历
        var start = Number(attr(aCalendar, 'start')) || 2010,
            end = Number(attr(aCalendar, 'end')) || 2025;

        past = !(attr(aCalendar, 'past') == null);
        $this.hours = !(attr(aCalendar, 'hours') == null);
        $this.hoursPast = !(attr(aCalendar, 'hours-past') == null);

        $this.shield = getDate(attr(aCalendar, 'shield') || '');
        $this.startDate = getDate(attr(aCalendar, 'start-date') || '');
        var prev,now,next, oDate = new Date();

        if(!$this.startDate instanceof Array || !$this.startDate){
            mNow = 0;
            yNow = 0;

            $this.startJSON.prev = { y : yNow, m : mNow - 1 };
            $this.startJSON.now = { y : yNow, m : mNow };
            $this.startJSON.next = { y : yNow, m : mNow + 1 };
        }
    
        // 创建日历对象列表
        $this.appendList($this.startJSON, function(){
            $this.addEvent();
        });
    }
            
    oCalen.onclick = function(ev){
        var oEv = ev.targetTouches ? ev.targetTouches[0] : (ev || event);
        oEv.cancelBubble = true;
    }

    /**
     * 创建日历列表
     * @return {[type]}        [description]
     */
    Calendar.prototype.createCalenList = function(data, setTitle){
        var oList = document.createElement('div'),
            created = 0,
            $this = this;

        data = data || {};
        data.m = data.m || 0;
        data.y = data.y || 0;

        // debugger;
        var date = new Date(),
            tDay = date.getDate();

            date.setFullYear(date.getFullYear() + data.y, (date.getMonth() + data.m + 1), 1, 0, 0, 0);
            date.setDate(0);

        var dSun = date.getDate();

            date.setDate(1);
        var dWeek = date.getDay();

        var date = new Date();
            date.setFullYear(date.getFullYear() + data.y, date.getMonth() + data.m, 1, 0, 0, 0);

        // 获取当前年月
        var tMonth = date.getMonth() + 1,
            tYear = date.getFullYear();

        // 设置上一个月的最后一天
            date.setDate(0);

        var lastDay = date.getDate(), lastMonths = [];
        for(var i = lastDay ; i > 0 ; i--)lastMonths.push(i);

        // 设置标题
        if(setTitle){
            yearTitle.innerHTML = tYear+'年';
            monthTitle.innerHTML = (tMonth < 10 ? '0' + tMonth : tMonth)+'月';
            attr(yearTitle, 'data-value', tYear);
            attr(monthTitle, 'data-value', tMonth - 1);
        }

        // 创建上月尾部分
        var lastMonthDay = dWeek + 7;
            lastMonthDay = lastMonthDay >= 10 ? lastMonthDay - 7 : lastMonthDay;

        for(var i = 0 ; i < lastMonthDay ; i++){

            var oSpan = create('span'),
                oNum = create('a', {
                    "data-calen" : (tYear + '/' + (tMonth - 1) + '/' + lastMonths[i]),
                    "class" : 'prev-m prev-to-month pasted',
                    "href" : 'javascript:;'
                }, lastMonths[i]);

            if(lastMonths[i] == tDay && data.m == 1 && !data.y && !data.d || !data.y && Number($this.fixDate.m) + 1 == tMonth && $this.fixDate.d == lastMonths[i]){
                toolClass(oNum, 'today');
            }

            // 设置禁用日期
            if(setShiled(tYear, tMonth - 1, lastMonths[i]))toolClass(oNum, 'pasted shield');

            oSpan.appendChild(oNum);

            if(oList.children.length){
                oList.insertBefore(oSpan, oList.children[0]);
            } else {
                oList.appendChild(oSpan);
            }

            created++;
        }

        // 这当前月的日期列表
        for(var i = 0 ; i < dSun ; i++){
            created++;

            var n = i + 1,
                oSpan = create('span'),
                oNum = create('a', {
                    "data-calen" : (tYear + '/' + tMonth + '/' + n),
                    "href" : 'javascript:;'
                }, n),
                oDate = new Date();

            switch(created % 7){
                case 0: case 1: oNum.className = 'weekend'; break;
            }

            if(!data.m && !data.y || !data.y && $this.fixDate.m == tMonth){
                if(($this.fixDate.d == n && $this.fixDate.m == tMonth) || (!$this.fixDate.d && n == tDay)){

                    oNum.className = oNum.className + ' today';
                }
                else if((past || $this.hoursPast) && n < tDay){
                    oNum.className = oNum.className + ' expire pasted';
                }
            }
            else if((past || $this.hoursPast) && data.m < 0 && data.y <= 0){
                oNum.className = ' expire pasted';
            }

            // 设置是否小于用户定义的开始日期
            if(tYear <= $this.fixDate.y && tMonth <= $this.fixDate.m && n < data.d || tYear <= $this.fixDate.y && tMonth < $this.fixDate.m){
                if($this.startDate)toolClass(oNum, 'expire pasted');
            }

            // 设置禁用日期
            if(setShiled(tYear, tMonth, n))toolClass(oNum, 'pasted shield');

            oSpan.appendChild(oNum);
            oList.appendChild(oSpan);
        }

        // 创建下月尾部分
        var nextMonths = 42 - oList.children.length;

        for(var i = 0 ; i < nextMonths ; i++){
            var n = i + 1,
                oSpan = create('span'),
                oNum = create('a', {
                    "data-calen" : (tYear + '/' + (tMonth + 1) + '/' + n),
                    "class" : 'next-m next-to-month',
                    "href" : 'javascript:;'
                    }, n);

            if(n == tDay && data.m == -1 && !data.y && !data.d || !data.y && $this.fixDate.m - 1 == tMonth && $this.fixDate.d == n){
                toolClass(oNum, 'today');
            }

            // 设置禁用日期
            if(setShiled(tYear, tMonth + 1, n))toolClass(oNum, 'pasted shield');

            oSpan.appendChild(oNum);
            oList.appendChild(oSpan);
        }

        // 设置禁用日期
        function setShiled(iyear, imonth, idate){
            if(!$this.shield)return false;

            for(var k = 0 ; k < $this.shield.length ; k++){
                $this.shield[k].y = $this.shield[k].y || data.getFullYear();
                $this.shield[k].m = $this.shield[k].m || data.getMonth() + 1;
                $this.shield[k].d = $this.shield[k].d || data.getDate();

                if(iyear == $this.shield[k].y && imonth == $this.shield[k].m && idate == $this.shield[k].d)return true;
            }
            return false;
        }

        return oList;
    }

    /**
     * 创建时间
     * @return {[type]} [description]
     */
    Calendar.prototype.createTime = function(obj, date, today, past){
        var oTime = getElement(oCalen, '.calendar-time'),
            child = [],
            oDate = new Date(),
            day = oDate.getDate(),
            hours = oDate.getHours(),
            $this = this;

        if(!oTime.length){
            oTime = create('div', {"class" : 'calendar-time'});

            for(var i = 0 ; i < 24 ; i++){

                var time = i < 10 ? '0' + i : i ;
                    time += ':00';

                var oSpan = create('span'),
                    oNum = create('a', {"href" : 'javascript:;', "data-time" : time}, time);

                oSpan.appendChild(oNum);
                oTime.appendChild(oSpan);
                child.push({"obj" : oNum, "time" : parseInt(time, 10)});
            }
        }
        else {
            oTime = oTime[0];
            var arr = getElement(oTime, 'a');

            for(var i = 0 ; i < arr.length ; i++){
                child.push({"obj" : arr[i], "time" : parseInt(attr(arr[i], 'data-time'), 10)});
            }
        }

        toolClass(oTime, 'active');

        for(var i = 0 ; i < child.length ; i++){

            if($this.hoursPast && ((mNow < 0 && yNow <= 0) || (today == day &&  child[i].time <= hours) || (mNow <= 0 && yNow <= 0 && today < day))){
                toolClass(child[i].obj, 'expire pasted');
                child[i].obj.active = false;
            } else {
                toolClass(child[i].obj, 'expire pasted', 'remove');
                child[i].obj.active = true;
            }

            (function(time){
                child[i].obj.onclick = function(){

                    // 设置日期时间
                    if(this.active){
                        var val = date + ' ' + (time < 10 ? '0' + time : time) + ':00';

                        if(obj.value != null){
                            obj.value = val;
                        } else if(obj.innerHTML != null) {
                            obj.innerHTML = val;
                        }
                        // hideCalen();
                    }
                    toolClass(oTime, 'active', 'remove');
                }
            })(child[i].time);
        }

        oCalen.appendChild(oTime);
    }

    /**
     * 创建头部
     * @return {[type]}      [description]
     */
    Calendar.prototype.createHeader = function(cb){
        calenTitles = calenTitles || [];

        var $this = this;
        var header = create('div', {"class" : 'calendar-header'});

        var year = create('span', {"class" : 'calendar-year'}),
            calenYearTxt = create('a', {"class" : 'calendar-year-txt calendar-title', "href" : 'javascript:;'});
        var month = create('span', {"class" : 'calendar-month'}),
            calenMonthTxt = create('a', {"class" : 'calendar-month-txt calendar-title', "href" : 'javascript:;'});

        year.appendChild(calenYearTxt);
        month.appendChild(calenMonthTxt);

        header.appendChild(year);
        header.appendChild(month);

        calenTitles.push(calenYearTxt, calenMonthTxt);

        monthTitle = calenMonthTxt;
        yearTitle = calenYearTxt;

        if(oCalen.children.length){
            oCalen.insertBefore(header, oCalen.children[0]);
        } else {
            oCalen.appendChild(header);
        }

        for(var i = 0 ; i < header.children.length ; i++){
            header.children[i].ontouchstart = function(){
                toolClass(this, 'active');
            }
            header.children[i].ontouchend = function(){
                toolClass(this, 'active', 'remove');
            }
        }

        cb && cb();
    }

    /**
     * 创建头部
     * @return {[type]}      [description]
     */
    Calendar.prototype.createWeek = function(){
        var weeks = '日一二三四五六';

         for(var i = 0 ; i < 7 ; i++){
            var n = i + 1, data = {};
            if(n % 7 == 1 || n % 7 == 0)data["class"] = 'weekend';

             calendarWeek.appendChild(create('span', data, weeks.charAt(i)));
         }
         oCalen.appendChild(calendarWeek);
    } 

    /**
     * 创建切换
     * @return {[type]}      [description]
     */
    Calendar.prototype.createWeeklist = function(){
        calendarWeeklist = create('div', {"class" : 'calendar-weeklist close'},'这里是周历'),    // 日历切换显示隐藏
        oCalen.appendChild(calendarWeeklist);
    } 

    /**
     *
     * 插入日历对象
     * @param  {Function} cb [description]
     * @return {[type]}      [description]''
     */
    Calendar.prototype.appendList = function(data, cb){
        data = data || {};
        data.prev = data.prev || {m : mNow - 1, y : yNow};
        data.now = data.now || {m : mNow, y : yNow};
        data.next = data.next || {m : mNow + 1, y : yNow};

        calendarList.innerHTML = '';

        calendarList.appendChild(this.createCalenList(data.prev));
        calendarList.appendChild(this.createCalenList(data.now, true));
        calendarList.appendChild(this.createCalenList(data.next));

        cb && cb();
    }


    /**
     * 设置日历事件
     */
    Calendar.prototype.addEvent = function(){
        var $this = this;
        var aCalenSet = calendarList.getElementsByTagName('a');

        for(var i = 0 ; i < aCalenSet.length ; i++){
            aCalenSet[i].onclick = function(){

                if(toolClass(this, 'prev-to-month', 'has')){
                    $this.switchDate(-1);
                }
                else if(toolClass(this, 'next-to-month', 'has')){
                    $this.switchDate(1);
                }
                else if(!toolClass(this, 'pasted', 'has') && !toolClass(this, 'shield', 'has')){

                    var date = attr(this, 'data-calen'), today = this.innerHTML;
                        date = format(date, (attr(aCalendar, 'format') || false));

                    if($this.hours){
                        $this.createTime(aCalendar, date, today, past);
                    }
                    else {
                        if(aCalendar && typeof aCalendar.value == 'undefined'){
                            // aCalendar.innerHTML = date;
                            aCalendar.setAttribute('chooseDate',date);
                            window.xtag&&window.xtag.trigger&&window.xtag.trigger(aCalendar,'xchange',date);
                            for(var j=0;j<aCalenSet.length;j++){
                                toolClass(aCalenSet[j], 'active', 'remove');
                            }
                            toolClass(this, 'active', 'add');
                        }
                        else if(aCalendar) {
                            var type = typeof aCalendar.value;
                            if(type === 'string' || type === 'number'){
                                if(aCalendar.oldValue != date){

                                    aCalendar.value = date;
                                    aCalendar.oldValue = date;

                                }
                            }
                        }
                        // hideCalen();
                    }
                }
            }
        }
    }

    /**
     * 切换上下月
     * @param  {[type]} dir  [description]
     * @param  {[type]} type [description]
     * @return {[type]}      [description]
     */
    Calendar.prototype.switchDate = function(dir, type){
        var $this = this;
        type = type || 'month';

        switch(type){
            case 'month':
                dir > 0 ? mNow++ : mNow-- ;

                $this.startJSON.prev.m = mNow - 1;
                $this.startJSON.now.m = mNow;
                $this.startJSON.next.m = mNow + 1;

                $this.transitions(calendarList, dir > 0 ? -1 :1);
                break;
            case 'year':
                $this.appendList({
                    prev : {
                        m : mNow,
                        y : yNow - 1
                    },
                    next : {
                        m : mNow,
                        y : yNow + 1
                    }
                }, function(){
                    dir > 0 ? yNow++ : yNow-- ;
                    $this.startJSON.prev.y = yNow;
                    $this.startJSON.now.y = yNow;
                    $this.startJSON.next.y = yNow;
                    $this.transitions(calendarList, dir > 0 ? -1 : 1);
                });
                break;
        }
    }

    /**
     * 切换月份动画
     * @param  {[type]} obj [description]
     * @param  {[type]} dir [上个月还是下个月]
     */
    Calendar.prototype.transitions = function(obj, dir){
        var $this = this;

        if(dir > 0){
            toolClass(obj, 'silde prev-to');
        }
        else {
            toolClass(obj, 'silde next-to');
        }

        setTimeout(function(){
            end();
        }, 500)

        function end(){
            $this.appendList($this.startJSON, function(){
                toolClass(obj, 'silde prev-to next-to', 'remove');
                $this.addEvent();
                silde = false;
            })
        }
    }

    /**
     * 切换月份动画
     * @param  {[type]} obj [description]
     * @param  {[type]} dir [上个周还是下个周]
     */
    Calendar.prototype.transitionsWeek = function(obj, dir){
        var $this = this;

        /*if(dir > 0){
            toolClass(obj, 'silde prev-to');
        }
        else {
            toolClass(obj, 'silde next-to');
        }

        setTimeout(function(){
            end();
        }, 500)

        function end(){
            $this.appendList($this.startJSON, function(){
                toolClass(obj, 'silde prev-to next-to', 'remove');
                $this.addEvent();
                silde = false;
            })
        }*/
        silde = false;
    }

    /**/
    Calendar.prototype.selectDate = function(obj, obj2, attr, val){
        var $this = this;

        this.startJSON.prev[attr] = (attr == 'm' ? val - 1 : val);
        this.startJSON.now[attr] = val;
        this.startJSON.next[attr] = (attr == 'm' ? val + 1 : val);

        this.appendList(this.startJSON, function(){
            $this.addEvent();
        });

        toolClass(obj, 'active');
        toolClass(obj2, 'active', 'remove');

        selectYearBox.show = false;
        selectMonthBox.show = false;
    }

    /**
     * 滑动切换日期
     * @param  {[type]} ev [description]
     * @return {[type]}    [description]
     */
    function sildeSwitch(obj, callBack){
        obj.onmousedown = start;
        obj.addEventListener('touchstart', start, false);

        function start(ev){
            var oEv = ev.targetTouches ? ev.targetTouches[0] : (ev || event);
            var disX = oEv.pageX;
            var disY = oEv.pageY;
            var needW = parseInt(document.documentElement.clientWidth / 5, 10);
            var needH = parseInt(obj.offsetHeight / 5, 10);
            var dir;
            var dir2;

            var $this = this;

            function move(ev){
                var oEv = ev.targetTouches ? ev.targetTouches[0] : (ev || event);
                dir = oEv.pageX - disX;
                dir2 = oEv.pageY - disY;
                if(silde)return false;

                if(Math.abs(dir) >= needW){
                    silde = true;
                    callBack && callBack($this, dir,0);
                }else if(Math.abs(dir2) >= needH){
                    callBack && callBack($this, 0,dir2);
                }

                oEv.preventDefault && oEv.preventDefault();
                return false;
            }

            function end(ev){
                this.onmousemove && (this.onmousemove = null);
                this.onmouseup && (this.onmouseup = null);

                this.removeEventListener('touchmove', move, false);
                this.removeEventListener('touchend', end, false);
            }

            this.onmousemove = move;
            this.onmouseup = end;

            obj.addEventListener('touchmove', move, false);
            obj.addEventListener('touchend', end, false);
        }
    }

    /**
     * 查找/添加/删除 className
     * @param  {[type]} obj    [description]
     * @param  {[type]} sClass [需要处理的class]
     * @param  {[type]} type   ['add:添加'(默认), 'remove:删除', 'has:查找']
     */
    function toolClass(obj, sClass, type){
        if(!sClass)return;

        var nowClass = obj.className.replace(/\s+/g, ' ');
            nowClass = nowClass.split(' ');

            sClass = sClass.replace('^\s+|\s+$').replace(/\s+/, ' ').split(' ');
            type = type || 'add';

        for(var i = 0 ; i < nowClass.length ; i++){
            switch(type){
                case 'has': if(sClass[0] == nowClass[i])return true; break;
                case 'add':
                case 'remove': 
                    for(var x = 0 ; x < sClass.length ; x++){
                        if(sClass[x] == nowClass[i])nowClass.splice(i, 1);
                    }
                break;
            }
        }

        if(type == 'add')nowClass = nowClass.concat(sClass);

        obj.className = nowClass.join(' ');
    }

    /**
     * 获取元素
     * @param  {[type]} parent [description]
     * @param  {[type]} str    [type]
     */
    function getElement(parent, str){
        var result;

        switch(str.charAt(0)){
            case '#':
                result = parent.getElementById(str.substring(1));
                break;
            case '.':
                result = parent.getElementsByClassName(str.substring(1));
                break;
            default: 
                result = parent.getElementsByTagName(str);
                break;
        }

        return result;
    }

    /**
     * 创建元素
     * @param  {[type]} tagname [标签名字]
     * @param  {[type]} attr    [属性(多个)]
     * @param  {[type]} html    [内容]
     */
    function create(tagname, attr, html){
        if(!tagname)return;

        attr = attr || {};
        html = html || '';

        var element = document.createElement(tagname);

        for(var i in attr){
            element.setAttribute(i, attr[i]);
        }

        element.innerHTML = html;
        return element;
    }
    
    /**
     * 隐藏日历
     */
    function hideCalen(){
        toolClass(oCalenWrap, 'close');
        setTimeout(function(){
            toolClass(oCalenWrap, 'active close', 'remove');
        }, 290);
    }
    
    /**
     * 日历的格式
     * @param  {[type]} str  [description]
     * @param  {[type]} fmat [description]
     * @return {[type]}      [description]
     */
    function format(str, fmat){
        if(!str)return false;
        str = str.split('/');
        fmat = fmat || 'y/m/d';
        
        var n = fmat.charAt(0), count = 0;
        
        for(var i = 0 ; i < fmat.length ; i++){
            if(n.charAt(count) != fmat.charAt(i)){
                n += fmat.charAt(i);
                count++;
            }
        }        
        
        var data = {"y" : str[0], "m" : str[1], "d" : str[2]}, symbol = '', result = '';
        
        if(/\//g.test(n)){
            symbol = '/';
        } else if(/\-/g.test(n)) {
            symbol = '-';
        }
        
        n = n.split(symbol);
        
        for(var i = 0 ; i < n.length ; i++){
            result += data[n[i]];
            if(i < n.length - 1)result += symbol;
        }
        
        return result;
    }

    /**
     * / 字符串获取年月日
     * @param  {[type]} str [description]
     * @param  {[type]} one [description]
     */
    function getDate(str, one){
        str = str.replace(/[\'\s]+/g, '');
        if(!str)return;

        str = str.match(/(\d+[\/\-]\d+[\/\-]\d+)/g);

        var data = [];

        for(var i = 0 ; i < str.length ; i++){
            var arr = str[i].match(/\d+/g), result = {};

            if(arr.length == 3){
                result["m"] = arr[1];

                if(arr[0].length == 4){
                    result["y"] = arr[0];
                    result["d"] = arr[2];
                } else {
                    result["d"] = arr[0];
                    result["y"] = arr[2];
                }
            }
            else if(arr.length == 2) {
                if(arr[0].length == 4){
                    result["y"] = arr[0];
                    result["m"] = arr[1];
                }
                else if(arr[0].length <= 2){
                    result["m"] = arr[0];
                    result["d"] = arr[1];
                }
            }
            data.push(result);
        }

        return data;
    }

    /**
     * 操作对象属性
     */
    function attr(obj, attr, val){
        if(!obj)return null;
        switch(arguments.length){
            case 3: obj.setAttribute(attr, val); break;
            case 2: return obj.getAttribute(attr); break;
        }
    }

    window.addEventListener('load', function(){
        new Calendar();
    }, false);

    return Calendar;
}));