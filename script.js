document.addEventListener('DOMContentLoaded',()=>{
  if(window.lucide) lucide.createIcons();

  const timerDisplay=document.getElementById('timerDisplay');
  const progressCircle=document.getElementById('progressCircle');
  const startBtn=document.getElementById('startBtn');
  const pauseBtn=document.getElementById('pauseBtn');
  const resetBtn=document.getElementById('resetBtn');
  const statusText=document.getElementById('statusText');
  const historyList=document.getElementById('historyList');
  const beepAudio=document.getElementById('beepAudio');

  const studyForm=document.getElementById('studyForm');
  const taskInput=document.getElementById('taskInput');
  const timeInput=document.getElementById('timeInput');
  const scheduleList=document.getElementById('scheduleList');

  let focusMinutes=25, breakMinutes=5;
  let timer=null,isRunning=false,isFocus=true,timeLeft=focusMinutes*60;
  let circleR=85;
  const circumference=2*Math.PI*circleR;
  progressCircle.style.strokeDasharray=circumference;
  progressCircle.style.strokeDashoffset=circumference;

  let schedule=JSON.parse(localStorage.getItem('studySchedule')||'[]');
  let history=JSON.parse(localStorage.getItem('pomodoroHistory')||'[]');

  let startTime = null;
  let endTime = null;

  const formatTime=s=>{const m=Math.floor(s/60),sec=s%60;return String(m).padStart(2,'0')+':'+String(sec).padStart(2,'0');}

  function updateDisplay(){
    timerDisplay.textContent=formatTime(timeLeft);
    statusText.textContent=isFocus?'Modo: Foco 💡':'Modo: Pausa ☕';
    updateProgress();
  }

  function updateProgress(){
    const total=(isFocus?focusMinutes:breakMinutes)*60;
    const pct=100*(1 - timeLeft/total);
    const offset=circumference*(timeLeft/total);
    progressCircle.style.strokeDashoffset=offset;

    if(pct<=30) progressCircle.style.stroke='#ef4444';
    else if(pct<=70) progressCircle.style.stroke='#facc15';
    else progressCircle.style.stroke='#10b981';
  }

  function saveSchedule(){ localStorage.setItem('studySchedule',JSON.stringify(schedule)); }
  function saveHistory(){ localStorage.setItem('pomodoroHistory',JSON.stringify(history)); }

  function renderSchedule(){
    scheduleList.innerHTML='';
    if(schedule.length===0){ scheduleList.innerHTML='<li class="muted">Nenhuma meta adicionada</li>'; return; }
    schedule.forEach((s,idx)=>{
      const li=document.createElement('li');
      li.innerHTML=`
      <div style="display:flex;flex-direction:column;gap:3px">
        <strong>${s.task}</strong>
        <small>⏰ ${s.time}</small>
      </div>
      <div>
        <button class="small-btn ghost" data-action="start" data-idx="${idx}">▶ Iniciar</button>
        <button class="small-btn warn" data-action="remove" data-idx="${idx}">❌</button>
      </div>`;
      scheduleList.appendChild(li);
    });
  }

  function addHistory(text){
    const ts=new Date().toLocaleTimeString();
    history.unshift({text,ts});
    if(history.length>50) history.pop();
    saveHistory(); renderHistory();
  }

  function renderHistory(){
    historyList.innerHTML='';
    if(history.length===0){ historyList.innerHTML='<li class="muted">Nenhum ciclo concluído</li>'; return; }
    history.forEach((h, idx)=>{
      const li=document.createElement('li'); 
      li.className='item';
      li.innerHTML=`
        <span>${h.text}</span>
        <small>${h.ts}</small>
        <button class="small-btn warn" data-idx="${idx}" data-action="remove">❌</button>
      `;
      historyList.appendChild(li);
    });
  }

  function playBeep(){ beepAudio.currentTime=0; beepAudio.play().catch(()=>{}); }

  function startTimer(){
    if(isRunning) return;
    isRunning = true;
    startBtn.disabled = true; 
    pauseBtn.disabled = false;

    startTime = Date.now();
    const duration = timeLeft * 1000;
    endTime = startTime + duration;

    timer = setInterval(() => {
      const now = Date.now();
      timeLeft = Math.round((endTime - now) / 1000);

      if(timeLeft <= 0){
        timeLeft = 0;
        updateDisplay();
        playBeep();
        addHistory(isFocus ? 'Ciclo de Foco concluído ✅' : 'Pausa concluída ☕');
        isFocus = !isFocus;
        timeLeft = (isFocus ? focusMinutes : breakMinutes) * 60;
        startTimer();
      } else {
        updateDisplay();
      }
    }, 1000);
  }

  function pauseTimer(){
    if(!isRunning) return;
    isRunning = false;
    clearInterval(timer);
    startBtn.disabled = false;
    pauseBtn.disabled = true;

    const now = Date.now();
    timeLeft = Math.round((endTime - now) / 1000);
  }

  function resetTimer(){
    pauseTimer();
    isFocus=true;
    timeLeft=focusMinutes*60;
    updateDisplay();
    progressCircle.style.strokeDashoffset=circumference;
    progressCircle.style.stroke='#10b981';
  }

  studyForm.addEventListener('submit',e=>{
    e.preventDefault(); const task=taskInput.value.trim(),time=timeInput.value;
    if(!task||!time) return;
    schedule.push({task,time}); saveSchedule(); renderSchedule(); taskInput.value=''; timeInput.value='';
  });

  scheduleList.addEventListener('click',e=>{
    const btn=e.target.closest('button'); if(!btn) return;
    const action=btn.dataset.action, idx=+btn.dataset.idx;
    if(action==='start'){ resetTimer(); startTimer(); addHistory(`Iniciado: ${schedule[idx].task}`); }
    else if(action==='remove'){ schedule.splice(idx,1); saveSchedule(); renderSchedule(); }
  });

  historyList.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if(!btn) return;
    const action = btn.dataset.action;
    const idx = +btn.dataset.idx;
    if(action === 'remove'){ history.splice(idx,1); saveHistory(); renderHistory(); }
  });

  startBtn.addEventListener('click',startTimer);
  pauseBtn.addEventListener('click',pauseTimer);
  resetBtn.addEventListener('click',resetTimer);

  updateDisplay(); renderSchedule(); renderHistory();
});
