(function () {
  var calendarEl = document.getElementById("booking-calendar");
  var monthLabelEl = document.getElementById("booking-month-label");
  var timezoneLabelEl = document.getElementById("booking-timezone-label");
  var scheduleEmptyEl = document.getElementById("booking-schedule-empty");
  var scheduleErrorEl = document.getElementById("booking-schedule-error");
  var weekstripEl = document.getElementById("booking-cal-weekstrip");
  var gridEl = document.getElementById("booking-cal-grid");
  var dayLabelEl = document.getElementById("booking-cal-day-label");
  var dayEmptyEl = document.getElementById("booking-cal-day-empty");
  var dayListEl = document.getElementById("booking-cal-day-list");
  var dayPanelEl = document.querySelector(".booking-cal-daypanel");
  var calPrevBtn = document.getElementById("booking-cal-prev");
  var calNextBtn = document.getElementById("booking-cal-next");
  var classSelect = document.getElementById("booking-class");
  var bookingForm = document.getElementById("booking-form");

  var scheduleData = null;
  var scheduleYear = null;
  var singleMonthMode = false;
  var viewYear = null;
  var viewMonth = null;
  var selectedDate = null;
  var monthNavBound = false;
  var calendarClickBound = false;

  function currentLang() {
    var lang = document.documentElement.lang || "en";
    return lang.indexOf("zh") === 0 ? "zh" : "en";
  }

  function scheduleJsonUrl() {
    try {
      return new URL("booking-schedule.json", document.baseURI || window.location.href).href;
    } catch (e) {
      return "booking-schedule.json";
    }
  }

  function pick(obj, lang) {
    if (!obj) return "";
    return obj[lang] || obj.en || "";
  }

  function parseScheduleMonth() {
    var key = scheduleData && scheduleData.month;
    if (!key || !/^\d{4}-\d{2}$/.test(key)) return null;
    var parts = key.split("-");
    return { year: parseInt(parts[0], 10), month: parseInt(parts[1], 10) - 1 };
  }

  function beijingNow() {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Shanghai" }));
  }

  function formatMonthLabel(year, month, lang) {
    if (lang === "zh") {
      return year + "年" + (month + 1) + "月";
    }
    var names = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return names[month] + " " + year;
  }

  function eventsForMonth(allEvents, year, month) {
    var prefix = year + "-" + String(month + 1).padStart(2, "0") + "-";
    return (allEvents || []).filter(function (ev) {
      return ev.date && ev.date.indexOf(prefix) === 0;
    });
  }

  function updateMonthNavButtons() {
    if (!calPrevBtn || !calNextBtn) return;
    if (singleMonthMode) {
      calPrevBtn.disabled = true;
      calNextBtn.disabled = true;
      return;
    }
    calPrevBtn.disabled = viewMonth <= 0;
    calNextBtn.disabled = viewMonth >= 11;
  }

  function bindCalendarClicks() {
    if (calendarClickBound) return;
    calendarClickBound = true;
    if (gridEl) {
      gridEl.addEventListener("click", function (e) {
        var cell = e.target.closest(".booking-cal-cell");
        if (!cell || cell.disabled) return;
        var iso = cell.getAttribute("data-date");
        if (iso) selectDate(iso);
      });
    }
    if (weekstripEl) {
      weekstripEl.addEventListener("click", function (e) {
        var btn = e.target.closest(".booking-cal-weekstrip__day");
        if (!btn) return;
        var iso = btn.getAttribute("data-date");
        if (iso) selectDate(iso);
      });
    }
  }

  function bindMonthNav() {
    if (monthNavBound) return;
    monthNavBound = true;
    if (calPrevBtn) {
      calPrevBtn.addEventListener("click", function () {
        navigateMonth(-1);
      });
    }
    if (calNextBtn) {
      calNextBtn.addEventListener("click", function () {
        navigateMonth(1);
      });
    }
  }

  function navigateMonth(delta) {
    if (singleMonthMode || viewMonth === null) return;
    var nextMonth = viewMonth + delta;
    if (nextMonth < 0 || nextMonth > 11) return;
    viewMonth = nextMonth;
    var allEvents = scheduleData.events || [];
    var monthEvents = eventsForMonth(allEvents, viewYear, viewMonth);
    var map = eventsByDate(monthEvents);
    selectedDate = defaultSelectedDate(viewYear, viewMonth, map, monthEvents);
    updateMonthNavButtons();
    renderCalendarUI();
    refreshBookableSelect();
  }

  function isoDate(y, m, d) {
    var mm = String(m + 1).padStart(2, "0");
    var dd = String(d).padStart(2, "0");
    return y + "-" + mm + "-" + dd;
  }

  function beijingTodayIso() {
    var n = beijingNow();
    return isoDate(n.getFullYear(), n.getMonth(), n.getDate());
  }

  function addDaysToIso(iso, days) {
    var d = new Date(iso + "T12:00:00");
    d.setDate(d.getDate() + days);
    return isoDate(d.getFullYear(), d.getMonth(), d.getDate());
  }

  /** Booking dropdown: selected day (or today) through the following 14 days; no past dates. */
  function bookableEventsForSelect(allEvents) {
    var today = beijingTodayIso();
    var start = selectedDate || today;
    if (start < today) start = today;
    var end = addDaysToIso(start, 14);
    return sortedEvents(
      (allEvents || []).filter(function (ev) {
        return ev.date && ev.date >= start && ev.date <= end;
      })
    );
  }

  function isEventBookable(ev) {
    if (!ev || !scheduleData) return false;
    var list = bookableEventsForSelect(scheduleData.events || []);
    var id = ev.id || "";
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return true;
    }
    return false;
  }

  function refreshBookableSelect() {
    if (!scheduleData) return;
    populateClassSelect(bookableEventsForSelect(scheduleData.events || []), currentLang());
  }

  function isMorningClassTime(timeStr) {
    if (!timeStr) return false;
    if (/PM|pm|下午|晚上/i.test(timeStr)) return false;
    var m = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (!m) return false;
    return parseInt(m[1], 10) < 12;
  }

  function formatTimeForSelect(ev, lang) {
    var raw = pick(ev.time, lang);
    if (!raw) return "";
    if (lang === "zh") {
      if (isMorningClassTime(raw) && !/上午|早上/i.test(raw)) {
        return raw + " 上午";
      }
      return raw;
    }
    if (isMorningClassTime(raw) && !/AM|PM/i.test(raw)) {
      return raw + " AM";
    }
    return raw;
  }

  function timeSortKey(ev) {
    var t = pick(ev.time, "en") + " " + pick(ev.time, "zh");
    var m = t.match(/(\d{1,2}):(\d{2})/);
    if (!m) return 0;
    var h = parseInt(m[1], 10);
    var min = parseInt(m[2], 10);
    if (/PM|pm|下午|晚上/i.test(t) && h < 12) h += 12;
    if (h >= 12 && /AM|am|早上/i.test(t) && h > 12) h -= 12;
    return h * 60 + min;
  }

  function isHighlightedEvent(ev) {
    return !!(ev && (ev.highlight || ev.category === "workshop"));
  }

  function sortedEvents(events) {
    return events.slice().sort(function (a, b) {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      var ah = isHighlightedEvent(a) ? 0 : 1;
      var bh = isHighlightedEvent(b) ? 0 : 1;
      if (ah !== bh) return ah - bh;
      return timeSortKey(a) - timeSortKey(b);
    });
  }

  function eventsByDate(events) {
    var map = {};
    events.forEach(function (ev) {
      if (!ev.date) return;
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    });
    Object.keys(map).forEach(function (key) {
      map[key] = sortedEvents(map[key]);
    });
    return map;
  }

  function formatEventDate(iso, lang) {
    var d = new Date(iso + "T12:00:00");
    if (isNaN(d.getTime())) return iso;
    if (lang === "zh") {
      var weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
      return d.getFullYear() + "年" + (d.getMonth() + 1) + "月" + d.getDate() + "日（" + weekdays[d.getDay()] + "）";
    }
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatStripLabel(iso, lang) {
    var d = new Date(iso + "T12:00:00");
    if (isNaN(d.getTime())) return iso;
    if (lang === "zh") {
      var zhDays = ["日", "一", "二", "三", "四", "五", "六"];
      return zhDays[d.getDay()] + " " + d.getDate();
    }
    var enDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    return enDays[d.getDay()] + " " + d.getDate();
  }

  function categoryLabel(category, lang) {
    var map = {
      yoga: { en: "Yoga", zh: "瑜伽" },
      meditation: { en: "Meditation", zh: "冥想" },
      "sound-healing": { en: "Sound Healing", zh: "声音疗愈" },
      ayurveda: { en: "Ayurveda", zh: "阿育吠陀" },
      workshop: { en: "Workshop", zh: "工作坊" },
    };
    var entry = map[category] || { en: "Class", zh: "课程" };
    return entry[lang] || entry.en;
  }

  /** Visual + CSS key: hatha, yin, workshop, meditation, sound-healing, ayurveda, class */
  function eventStyleKey(ev) {
    var cat = ev.category || "class";
    if (cat === "yoga") {
      var title = (pick(ev.title, "en") + " " + pick(ev.title, "zh")).toLowerCase();
      if (title.indexOf("yin") >= 0 || title.indexOf("阴") >= 0) return "yin";
      if (title.indexOf("vinyasa") >= 0 || title.indexOf("流瑜伽") >= 0) return "vinyasa";
      if (title.indexOf("hatha") >= 0 || title.indexOf("哈他") >= 0) return "hatha";
      return "yoga";
    }
    if (
      cat === "workshop" ||
      cat === "meditation" ||
      cat === "sound-healing" ||
      cat === "ayurveda"
    ) {
      return cat;
    }
    return "class";
  }

  function typeLabel(ev, lang) {
    var key = eventStyleKey(ev);
    var map = {
      hatha: { en: "Hatha Yoga", zh: "哈他瑜伽" },
      vinyasa: { en: "Vinyasa Yoga", zh: "流瑜伽" },
      yin: { en: "Yin Yoga", zh: "阴瑜伽" },
      yoga: { en: "Yoga", zh: "瑜伽" },
      workshop: { en: "Workshop", zh: "工作坊" },
      meditation: { en: "Meditation", zh: "冥想" },
      "sound-healing": { en: "Sound Healing", zh: "声音疗愈" },
      ayurveda: { en: "Ayurveda", zh: "阿育吠陀" },
      class: { en: "Class", zh: "课程" },
    };
    var entry = map[key] || map.class;
    return entry[lang] || entry.en;
  }

  function defaultSelectedDate(year, month, map, events) {
    var today = new Date();
    var todayIso = isoDate(today.getFullYear(), today.getMonth(), today.getDate());
    if (today.getFullYear() === year && today.getMonth() === month && map[todayIso]) {
      return todayIso;
    }
    if (events.length) return events[0].date;
    return isoDate(year, month, 1);
  }

  function selectDate(iso) {
    if (!iso) return;
    var parts = iso.split("-");
    if (parts.length >= 2 && !singleMonthMode && scheduleYear) {
      var y = parseInt(parts[0], 10);
      var m = parseInt(parts[1], 10) - 1;
      if (y === scheduleYear && m >= 0 && m <= 11) {
        viewMonth = m;
      }
    }
    selectedDate = iso;
    renderCalendarUI();
    refreshBookableSelect();
    if (dayPanelEl) {
      dayPanelEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  function scrollToBooking(eventId) {
    if (classSelect && eventId) {
      classSelect.value = eventId;
    }
    if (bookingForm) {
      bookingForm.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (classSelect) {
      classSelect.focus();
    }
  }

  function createClassCard(ev, lang) {
    var styleKey = eventStyleKey(ev);
    var highlighted = isHighlightedEvent(ev);
    var article = document.createElement("article");
    article.className = "booking-class-card booking-class-card--" + styleKey;
    if (highlighted) article.classList.add("booking-class-card--highlight");
    article.setAttribute("role", "listitem");
    article.setAttribute("data-event-id", ev.id || "");

    var main = document.createElement("div");
    main.className = "booking-class-card__main";

    if (highlighted) {
      var badge = document.createElement("span");
      badge.className = "booking-class-card__badge";
      badge.setAttribute("data-en", "Featured");
      badge.setAttribute("data-zh", "重点推荐");
      badge.textContent = lang === "zh" ? "重点推荐" : "Featured";
      main.appendChild(badge);
    }

    var label = document.createElement("span");
    label.className = "booking-class-card__label";
    label.setAttribute("data-en", typeLabel(ev, "en"));
    label.setAttribute("data-zh", typeLabel(ev, "zh"));
    label.textContent = typeLabel(ev, lang);

    var title = document.createElement("h3");
    title.className = "booking-class-card__title";
    title.setAttribute("data-en", pick(ev.title, "en"));
    title.setAttribute("data-zh", pick(ev.title, "zh"));
    title.textContent = pick(ev.title, lang);

    var meta = document.createElement("ul");
    meta.className = "booking-class-card__meta";

    function addMeta(icon, textEn, textZh) {
      var li = document.createElement("li");
      li.innerHTML =
        '<span class="booking-class-card__icon" aria-hidden="true">' +
        icon +
        "</span><span data-en=\"" +
        textEn.replace(/"/g, "&quot;") +
        "\" data-zh=\"" +
        textZh.replace(/"/g, "&quot;") +
        "\">" +
        (lang === "zh" ? textZh : textEn) +
        "</span>";
      meta.appendChild(li);
    }

    addMeta("◷", pick(ev.time, "en"), pick(ev.time, "zh"));
    addMeta("◎", pick(ev.teacher, "en"), pick(ev.teacher, "zh"));
    addMeta("⌖", pick(ev.location, "en"), pick(ev.location, "zh"));
    if (ev.spots) {
      var capEn = ev.spots + " spots available";
      var capZh = "名额 " + ev.spots;
      addMeta("◉", capEn, capZh);
    }

    main.appendChild(label);
    main.appendChild(title);
    main.appendChild(meta);

    if (ev.note && (pick(ev.note, "en") || pick(ev.note, "zh"))) {
      var noteEl = document.createElement("p");
      noteEl.className = "booking-class-card__note";
      noteEl.setAttribute("data-en", pick(ev.note, "en"));
      noteEl.setAttribute("data-zh", pick(ev.note, "zh"));
      noteEl.textContent = pick(ev.note, lang);
      main.appendChild(noteEl);
    }

    var action = document.createElement("div");
    action.className = "booking-class-card__action";

    var bookBtn = document.createElement("button");
    bookBtn.type = "button";
    bookBtn.className = "booking-class-card__book booking-class-card__book--" + styleKey;
    bookBtn.setAttribute("data-en", "Book now");
    bookBtn.setAttribute("data-zh", "预约");
    bookBtn.textContent = lang === "zh" ? "预约" : "Book now";
    if (!isEventBookable(ev)) {
      bookBtn.disabled = true;
      bookBtn.setAttribute(
        "title",
        lang === "zh" ? "仅可预约当天起两周内的课程" : "Only classes within today + the next 2 weeks"
      );
    } else {
      bookBtn.addEventListener("click", function () {
        scrollToBooking(ev.id);
      });
    }

    action.appendChild(bookBtn);
    article.appendChild(main);
    article.appendChild(action);
    return article;
  }

  function renderWeekStrip(lang, map) {
    if (!weekstripEl || !selectedDate) return;
    var d = new Date(selectedDate + "T12:00:00");
    var day = d.getDay();
    var start = new Date(d);
    start.setDate(d.getDate() - day);

    weekstripEl.innerHTML = "";
    for (var i = 0; i < 7; i++) {
      var cell = new Date(start);
      cell.setDate(start.getDate() + i);
      var iso = isoDate(cell.getFullYear(), cell.getMonth(), cell.getDate());
      var inMonth = cell.getMonth() === viewMonth && cell.getFullYear() === viewYear;
      var hasClass = !!map[iso];

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "booking-cal-weekstrip__day";
      if (iso === selectedDate) btn.classList.add("is-selected");
      if (!inMonth) btn.classList.add("is-outside");
      if (hasClass) btn.classList.add("has-class");
      btn.setAttribute("data-date", iso);
      btn.setAttribute("aria-pressed", iso === selectedDate ? "true" : "false");
      btn.setAttribute("aria-label", formatEventDate(iso, lang));

      var wd = document.createElement("span");
      wd.className = "booking-cal-weekstrip__wd";
      wd.textContent = formatStripLabel(iso, lang).split(" ")[0];

      var num = document.createElement("span");
      num.className = "booking-cal-weekstrip__num";
      num.textContent = String(cell.getDate());

      btn.appendChild(wd);
      btn.appendChild(num);
      if (hasClass) {
        var dots = document.createElement("span");
        dots.className = "booking-cal-weekstrip__dots";
        dots.setAttribute("aria-hidden", "true");
        (map[iso] || []).slice(0, 4).forEach(function (ev) {
          var dot = document.createElement("i");
          dot.className = "booking-cal-dot--" + eventStyleKey(ev);
          dots.appendChild(dot);
        });
        btn.appendChild(dots);
      }

      weekstripEl.appendChild(btn);
    }
  }

  function renderMonthGrid(lang, map) {
    if (!gridEl) return;
    gridEl.innerHTML = "";

    var first = new Date(viewYear, viewMonth, 1);
    var startPad = first.getDay();
    var daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    var totalCells = Math.ceil((startPad + daysInMonth) / 7) * 7;

    for (var c = 0; c < totalCells; c++) {
      var cell = document.createElement("button");
      cell.type = "button";
      cell.className = "booking-cal-cell";
      cell.setAttribute("role", "gridcell");

      var dayNum = c - startPad + 1;
      if (dayNum < 1 || dayNum > daysInMonth) {
        cell.classList.add("is-outside");
        cell.disabled = true;
        cell.innerHTML = "<span class=\"booking-cal-cell__num\"></span>";
        gridEl.appendChild(cell);
        continue;
      }

      var iso = isoDate(viewYear, viewMonth, dayNum);
      var dayEvents = map[iso] || [];
      if (iso === selectedDate) cell.classList.add("is-selected");
      if (dayEvents.length) cell.classList.add("has-class");

      cell.setAttribute("data-date", iso);
      cell.setAttribute("aria-label", formatEventDate(iso, lang) + (dayEvents.length ? ", " + dayEvents.length + " classes" : ""));

      var num = document.createElement("span");
      num.className = "booking-cal-cell__num";
      num.textContent = String(dayNum);
      cell.appendChild(num);

      if (dayEvents.length) {
        var pills = document.createElement("span");
        pills.className = "booking-cal-cell__pills";
        sortedEvents(dayEvents).slice(0, 2).forEach(function (ev) {
          var pill = document.createElement("span");
          pill.className = "booking-cal-cell__pill booking-cal-cell__pill--" + eventStyleKey(ev);
          if (isHighlightedEvent(ev)) pill.classList.add("booking-cal-cell__pill--highlight");
          pill.setAttribute("data-en", pick(ev.title, "en"));
          pill.setAttribute("data-zh", pick(ev.title, "zh"));
          pill.textContent = pick(ev.title, lang);
          pills.appendChild(pill);
        });
        if (dayEvents.length > 2) {
          var more = document.createElement("span");
          more.className = "booking-cal-cell__more";
          more.setAttribute("data-en", "+" + (dayEvents.length - 2));
          more.setAttribute("data-zh", "+" + (dayEvents.length - 2));
          more.textContent = "+" + (dayEvents.length - 2);
          pills.appendChild(more);
        }
        cell.appendChild(pills);
      }

      gridEl.appendChild(cell);
    }
  }

  function renderDayPanel(lang) {
    if (!dayListEl || !dayLabelEl) return;
    var fullMap = eventsByDate((scheduleData && scheduleData.events) || []);
    var events = sortedEvents(fullMap[selectedDate] || []);
    var panelTitle = lang === "zh" ? "当日课程" : "Classes";
    if (selectedDate) {
      dayLabelEl.textContent = formatEventDate(selectedDate, lang);
    } else {
      dayLabelEl.textContent = panelTitle;
    }

    dayListEl.innerHTML = "";
    if (dayEmptyEl) dayEmptyEl.hidden = events.length > 0;

    events.forEach(function (ev) {
      dayListEl.appendChild(createClassCard(ev, lang));
    });
  }

  function renderCalendarUI() {
    if (!scheduleData || viewYear === null || viewMonth === null) return;
    var lang = currentLang();
    var monthEvents = sortedEvents(eventsForMonth(scheduleData.events || [], viewYear, viewMonth));
    var map = eventsByDate(monthEvents);

    if (monthLabelEl) {
      monthLabelEl.textContent = formatMonthLabel(viewYear, viewMonth, lang);
    }

    renderWeekStrip(lang, map);
    renderMonthGrid(lang, map);
    renderDayPanel(lang);
    updateMonthNavButtons();
  }

  function populateClassSelect(events, lang) {
    if (!classSelect) return;
    var placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.disabled = true;
    placeholder.selected = true;
    placeholder.setAttribute("data-en", "Select a class (today + next 2 weeks)");
    placeholder.setAttribute("data-zh", "请选择课程（当天起两周内）");
    placeholder.textContent =
      lang === "zh" ? "请选择课程（当天起两周内）" : "Select a class (today + next 2 weeks)";

    classSelect.innerHTML = "";
    classSelect.appendChild(placeholder);

    events.forEach(function (ev) {
      var opt = document.createElement("option");
      opt.value = ev.id || ev.date + "-" + pick(ev.title, "en");
      var labelEn =
        formatEventDate(ev.date, "en") +
        " · " +
        formatTimeForSelect(ev, "en") +
        " — " +
        pick(ev.title, "en");
      var labelZh =
        formatEventDate(ev.date, "zh") +
        " · " +
        formatTimeForSelect(ev, "zh") +
        " — " +
        pick(ev.title, "zh");
      opt.setAttribute("data-en", labelEn);
      opt.setAttribute("data-zh", labelZh);
      opt.textContent = lang === "zh" ? labelZh : labelEn;
      classSelect.appendChild(opt);
    });
  }

  function renderSchedule() {
    if (!scheduleData) return;
    var lang = currentLang();
    var events = sortedEvents(scheduleData.events || []);

    if (timezoneLabelEl && scheduleData.timezone) {
      timezoneLabelEl.setAttribute("data-en", pick(scheduleData.timezone, "en"));
      timezoneLabelEl.setAttribute("data-zh", pick(scheduleData.timezone, "zh"));
      timezoneLabelEl.textContent = pick(scheduleData.timezone, lang);
    }

    if (!events.length) {
      if (calendarEl) calendarEl.hidden = true;
      if (scheduleEmptyEl) scheduleEmptyEl.hidden = false;
      populateClassSelect([], lang);
      return;
    }

    if (scheduleEmptyEl) scheduleEmptyEl.hidden = true;
    if (calendarEl) calendarEl.hidden = false;

    singleMonthMode = false;
    var parsed = parseScheduleMonth();
    if (scheduleData.year) {
      scheduleYear = parseInt(scheduleData.year, 10);
      viewYear = scheduleYear;
      var now = beijingNow();
      if (now.getFullYear() === scheduleYear) {
        viewMonth = now.getMonth();
      } else {
        viewMonth = 0;
      }
    } else if (parsed) {
      scheduleYear = parsed.year;
      viewYear = parsed.year;
      viewMonth = parsed.month;
      singleMonthMode = true;
    } else {
      var first = new Date(events[0].date + "T12:00:00");
      scheduleYear = first.getFullYear();
      viewYear = scheduleYear;
      viewMonth = first.getMonth();
    }

    bindMonthNav();
    bindCalendarClicks();

    var monthEvents = eventsForMonth(events, viewYear, viewMonth);
    var map = eventsByDate(monthEvents);
    selectedDate = defaultSelectedDate(viewYear, viewMonth, map, monthEvents);

    renderCalendarUI();
    refreshBookableSelect();
  }

  function applySchedule(data) {
    scheduleData = data;
    renderSchedule();
  }

  function showScheduleError() {
    if (scheduleErrorEl) scheduleErrorEl.hidden = false;
    if (scheduleEmptyEl) scheduleEmptyEl.hidden = true;
    if (calendarEl) calendarEl.hidden = true;
  }

  function loadSchedule() {
    if (scheduleErrorEl) scheduleErrorEl.hidden = true;

    var embedded = window.FLII_BOOKING_SCHEDULE;
    if (embedded && embedded.events) {
      applySchedule(embedded);
    }

    fetch(scheduleJsonUrl())
      .then(function (res) {
        if (!res.ok) throw new Error("schedule fetch failed");
        return res.json();
      })
      .then(function (data) {
        applySchedule(data);
      })
      .catch(function () {
        if (scheduleData && scheduleData.events && scheduleData.events.length) {
          return;
        }
        if (embedded && embedded.events) {
          applySchedule(embedded);
          return;
        }
        showScheduleError();
      });
  }

  document.addEventListener("flii-lang-change", function () {
    if (scheduleData) {
      renderSchedule();
      refreshBookableSelect();
    }
  });

  loadSchedule();

  if (bookingForm) {
    bookingForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var errorEl = document.getElementById("booking-form-error");
      var successEl = document.getElementById("booking-form-success");
      var submitBtn = bookingForm.querySelector('button[type="submit"]');
      if (errorEl) errorEl.hidden = true;
      if (successEl) successEl.hidden = true;

      var botcheck = bookingForm.querySelector('input[name="botcheck"]');
      if (botcheck && botcheck.checked) return;

      var fd = new FormData(bookingForm);
      var name = String(fd.get("name") || "").trim();
      var email = String(fd.get("email") || "").trim();
      var phone = String(fd.get("phone") || "").trim();
      var classId = String(fd.get("class_id") || "").trim();
      var message = String(fd.get("message") || "").trim();
      var accessKey = String(fd.get("access_key") || "").trim();
      var lang = currentLang();

      var classLabel = classId;
      if (classSelect && classId) {
        var selected = null;
        for (var i = 0; i < classSelect.options.length; i++) {
          if (classSelect.options[i].value === classId) {
            selected = classSelect.options[i];
            break;
          }
        }
        if (selected) {
          classLabel = lang === "zh" ? selected.getAttribute("data-zh") : selected.getAttribute("data-en");
          if (!classLabel) classLabel = selected.textContent;
        }
      }

      var body = "Class / Event: " + (classLabel || classId || "(not selected)") + "\n";
      if (phone) body += "Phone: " + phone + "\n";
      if (message) body += "\n" + message;

      if (submitBtn) submitBtn.disabled = true;

      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: accessKey,
          subject: "FLII HOLISTIC — Class Booking",
          from_name: name,
          name: name,
          email: email,
          replyto: email,
          message: body,
        }),
      })
        .then(function (res) {
          return res.json();
        })
        .then(function (data) {
          if (data.success) {
            bookingForm.reset();
            if (classSelect && classSelect.options.length) classSelect.selectedIndex = 0;
            if (successEl) successEl.hidden = false;
            try {
              var u = new URL(window.location.href);
              u.searchParams.set("sent", "1");
              window.history.replaceState(null, "", u.pathname + u.search);
            } catch (err) {}
            return;
          }
          if (errorEl) errorEl.hidden = false;
        })
        .catch(function () {
          if (errorEl) errorEl.hidden = false;
        })
        .finally(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }

  if (new URLSearchParams(window.location.search).get("sent") === "1") {
    var successEl = document.getElementById("booking-form-success");
    if (successEl) successEl.hidden = false;
  }
})();
