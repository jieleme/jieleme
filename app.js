// Web 版自律计时器应用 - 主逻辑
// 适配自小程序版本

// 全局应用数据
const app = {
    globalData: {
        onlineCount: 521 // 默认在线人数
    }
};

// 主应用状态
const state = {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    p1: 0,
    p2: 0,
    startTime: 0,
    levelName: "觉醒者",
    levelBadge: "🌱",
    totalReviews: 0,
    p1Description: "多巴胺系统恢复：0%",
    p2Description: "整体生理恢复：0%",

    // 标签页相关
    activeTab: 'progress',

    // 在线人数相关
    onlineCount: 521,

    // 打卡相关
    checkinStreak: 0,
    lastCheckinDate: '',
    checkinButtonText: '📅 今日未打卡',

    // 新用户引导相关（已移除）
    // showWelcomeModal: false,
    // currentGuideStep: 0,
    // showTimerTooltip: false,
    // showCheckinTooltip: false,
    // showSosTooltip: false,
    // showCommunityTooltip: false,
    // showProgressTooltip: false,

    // 定时器引用
    timer: null,
    onlineCountTimer: null
};

// DOM 元素引用
const elements = {
    // 欢迎模态框（已移除）
    // welcomeModal: document.getElementById('welcomeModal'),
    // closeWelcomeModal: document.getElementById('closeWelcomeModal'),
    // prevGuideStep: document.getElementById('prevGuideStep'),
    // nextGuideStep: document.getElementById('nextGuideStep'),

    // 提示气泡（已移除）
    // timerTooltip: document.getElementById('timerTooltip'),
    // checkinTooltip: document.getElementById('checkinTooltip'),
    // sosTooltip: document.getElementById('sosTooltip'),
    // progressTooltip: document.getElementById('progressTooltip'),

    // 计时器元素
    days: document.getElementById('days'),
    subTime: document.getElementById('subTime'),
    levelBadge: document.getElementById('levelBadge'),
    levelName: document.getElementById('levelName'),
    onlineCount: document.getElementById('onlineCount'),

    // 进度元素
    p1Progress: document.getElementById('p1Progress'),
    p2Progress: document.getElementById('p2Progress'),
    p1Bar: document.getElementById('p1Bar'),
    p2Bar: document.getElementById('p2Bar'),

    // 打卡元素
    checkinButton: document.getElementById('checkinButton'),
    checkinStreak: document.getElementById('checkinStreak'),
    streakDays: document.getElementById('streakDays'),

    // 统计元素
    totalReviews: document.getElementById('totalReviews')
};

// 初始化应用
function initializeApp() {
    // 检查是否需要显示问卷（Web版暂时跳过问卷功能）
    // checkAndRedirectToQuestionnaire();

    // 继续正常初始化
    initializePage();

    // 设置事件监听器
    setupEventListeners();
}

// 检查并显示新用户引导（已移除）
// function checkAndShowNewUserGuide() {
//     // 检查是否已经完成过引导
//     const guidanceCompleted = localStorage.getItem('newUserGuidanceCompleted');
//
//     if (!guidanceCompleted) {
//         // 显示欢迎模态框
//         state.showWelcomeModal = true;
//         elements.welcomeModal.style.display = 'flex';
//         elements.currentGuideStep = 0;
//         updateGuideSteps();
//     }
// }
//
// // 更新引导步骤显示（已移除）
// function updateGuideSteps() {
//     // 隐藏所有步骤
//     for (let i = 0; i <= 3; i++) {
//         const step = document.getElementById(`step${i}`);
//         if (step) step.style.display = 'none';
//     }
//
//     // 显示当前步骤
//     const currentStep = document.getElementById(`step${state.currentGuideStep}`);
//     if (currentStep) currentStep.style.display = 'block';
//
//     // 更新导航按钮显示
//     elements.prevGuideStep.style.display = state.currentGuideStep > 0 ? 'block' : 'none';
//     elements.nextGuideStep.textContent = state.currentGuideStep < 3 ? '下一步' : '完成引导';
// }

// 初始化页面
function initializePage() {
    // 从缓存读取开始时间
    let start = localStorage.getItem('startTime');
    if (!start) {
        start = Date.now();
        localStorage.setItem('startTime', start);
    }
    state.startTime = parseInt(start);

    // 加载复盘历史数量
    const reviews = JSON.parse(localStorage.getItem('reviewHistory')) || [];
    state.totalReviews = reviews.length;
    elements.totalReviews.textContent = state.totalReviews;

    // 加载打卡数据
    loadCheckinData();

    // 启动定时器
    startTimer();
    startOnlineCountTimer();

    // 测试环境（Web版不需要云函数测试）
    // testFreeCloudEnvironment();
}

// 加载打卡数据
function loadCheckinData() {
    const checkinData = JSON.parse(localStorage.getItem('checkinData')) || {
        streak: 0,
        lastCheckinDate: ''
    };

    // 更新打卡按钮文本
    const today = new Date().toISOString().split('T')[0];
    const isCheckedIn = checkinData.lastCheckinDate === today;

    state.checkinStreak = checkinData.streak;
    state.lastCheckinDate = checkinData.lastCheckinDate;
    state.checkinButtonText = isCheckedIn ? '📅 今日已打卡' : '📅 今日未打卡';

    elements.checkinButton.textContent = state.checkinButtonText;

    if (state.checkinStreak > 0) {
        elements.checkinStreak.style.display = 'block';
        elements.streakDays.textContent = state.checkinStreak;
    } else {
        elements.checkinStreak.style.display = 'none';
    }
}

// 启动计时器
function startTimer() {
    // 清理现有定时器
    if (state.timer) {
        clearInterval(state.timer);
    }

    // 保存定时器引用
    state.timer = setInterval(() => {
        const now = Date.now();
        const diff = now - state.startTime;

        // 计算天、时、分、秒逻辑
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        // 使用改进的混合曲线计算冲动阻断恢复进度
        const impulseBlockProgress = Math.min(Math.floor(hybridRecoveryCurve(d / 30) * 100), 99);

        // 计算成就等级
        const levelInfo = calculateLevel(d);

        // 获取进度描述
        const p1Description = getImpulseBlockDescription(impulseBlockProgress);
        const p2Description = "冲动阻断恢复中...";

        // 更新状态
        state.days = d;
        state.hours = h;
        state.minutes = m;
        state.seconds = s;
        state.p1 = impulseBlockProgress;
        state.p2 = impulseBlockProgress;
        state.levelName = levelInfo.levelName;
        state.levelBadge = levelInfo.levelBadge;
        state.p1Description = p1Description;
        state.p2Description = p2Description;

        // 更新 UI
        updateUI();
    }, 1000);
}

// 混合恢复曲线 - 结合对数和线性曲线
function hybridRecoveryCurve(x) {
    if (x <= 0.5) {
        // 前半部分使用对数曲线（快速恢复）
        return Math.log(1 + 4 * x) / Math.log(5);
    } else {
        // 后半部分使用线性曲线（稳定恢复）
        return 0.5 + 0.5 * (2 * x - 1);
    }
}

// 获取冲动阻断恢复描述
function getImpulseBlockDescription(progress) {
    if (progress >= 80) return `冲动阻断恢复：${progress}% - 冲动回路已完全阻断`;
    if (progress >= 50) return `冲动阻断恢复：${progress}% - 冲动显著减弱`;
    if (progress >= 25) return `冲动阻断恢复：${progress}% - 冲动开始减弱`;
    if (progress >= 10) return `冲动阻断恢复：${progress}% - 开始阻断冲动`;
    return `冲动阻断恢复：${progress}% - 准备阻断`;
}

// 计算成就等级
function calculateLevel(days) {
    let levelName = "觉醒者";
    let levelBadge = "🌱";

    if (days >= 365) {
        levelName = "本能的主人";
        levelBadge = "👑";
    } else if (days >= 180) {
        levelName = "意志王者";
        levelBadge = "🏆";
    } else if (days >= 90) {
        levelName = "自律传奇";
        levelBadge = "⭐";
    } else if (days >= 30) {
        levelName = "意志统帅";
        levelBadge = "🎖️";
    } else if (days >= 7) {
        levelName = "自律先锋";
        levelBadge = "🎗️";
    } else if (days >= 3) {
        levelName = "坚持战士";
        levelBadge = "⚔️";
    }

    return { levelName, levelBadge };
}

// 更新 UI
function updateUI() {
    // 更新计时器显示
    elements.days.textContent = state.days;
    elements.subTime.textContent = `${state.hours}小时${state.minutes}分${state.seconds}秒`;
    elements.levelBadge.textContent = state.levelBadge;
    elements.levelName.textContent = state.levelName;

    // 更新进度条
    elements.p1Progress.textContent = `${state.p1}%`;
    elements.p2Progress.textContent = `${state.p2}%`;
    elements.p1Bar.value = state.p1;
    elements.p2Bar.value = state.p2;

    // 更新在线人数
    elements.onlineCount.textContent = state.onlineCount;
}

// 启动在线人数定时器
function startOnlineCountTimer() {
    // 避免重复启动定时器
    if (state.onlineCountTimer) {
        clearInterval(state.onlineCountTimer);
    }

    state.onlineCountTimer = setInterval(() => {
        refreshOnlineStatus();
    }, 30000); // 30秒更新一次
}

// 刷新在线状态（Web版模拟）
function refreshOnlineStatus() {
    // Web版模拟在线人数变化
    state.onlineCount = 521 + Math.floor(Math.random() * 10);
    app.globalData.onlineCount = state.onlineCount;
    elements.onlineCount.textContent = state.onlineCount;
}

// 设置事件监听器
function setupEventListeners() {
    // 关闭欢迎模态框（已移除）
    // if (elements.closeWelcomeModal) {
    //     elements.closeWelcomeModal.addEventListener('click', closeWelcomeModal);
    // }

    // 上一步引导（已移除）
    // if (elements.prevGuideStep) {
    //     elements.prevGuideStep.addEventListener('click', prevGuideStep);
    // }

    // 下一步引导（已移除）
    // if (elements.nextGuideStep) {
    //     elements.nextGuideStep.addEventListener('click', nextGuideStep);
    // }

    // 关闭提示气泡（已移除）
    // window.closeAllTooltips = closeAllTooltips;

    // 打卡按钮 - 直接绑定到DOM元素
    const checkinButton = document.getElementById('checkinButton');
    if (checkinButton) {
        checkinButton.addEventListener('click', onDailyCheckIn);
    }

    // 也保留全局绑定以兼容其他可能的调用
    window.onDailyCheckIn = onDailyCheckIn;

    // SOS按钮 - 直接绑定到DOM元素
    const sosButton = document.querySelector('.btn-sos');
    if (sosButton) {
        sosButton.addEventListener('click', onSOS);
        console.log('SOS按钮事件绑定成功');
    } else {
        console.error('SOS按钮未找到');
    }

    // 重置按钮 - 直接绑定到DOM元素
    const resetButton = document.querySelector('.btn-reset');
    if (resetButton) {
        resetButton.addEventListener('contextmenu', onReset);
        // 阻止默认右键菜单
        resetButton.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            return false;
        });
        console.log('重置按钮事件绑定成功');
    } else {
        console.error('重置按钮未找到');
    }

    // 也保留全局绑定以兼容HTML中的onclick
    window.onSOS = onSOS;
    window.onReset = onReset;

    // 添加错误处理
    window.addEventListener('error', function(error) {
        console.error('JavaScript错误:', error.message);
    });
}

// 关闭欢迎模态框（已移除）
// function closeWelcomeModal() {
//     state.showWelcomeModal = false;
//     elements.welcomeModal.style.display = 'none';
// }
//
// // 上一步引导（已移除）
// function prevGuideStep() {
//     const currentStep = state.currentGuideStep;
//
//     if (currentStep > 0) {
//         state.currentGuideStep = currentStep - 1;
//         updateGuideSteps();
//     }
// }
//
// // 下一步引导（已移除）
// function nextGuideStep() {
//     const currentStep = state.currentGuideStep;
//
//     if (currentStep < 3) {
//         state.currentGuideStep = currentStep + 1;
//         updateGuideSteps();
//     } else {
//         // 引导完成
//         completeGuidance();
//     }
// }
//
// // 完成引导（已移除）
// function completeGuidance() {
//     state.showWelcomeModal = false;
//     elements.welcomeModal.style.display = 'none';
//
//     // 标记引导已完成
//     localStorage.setItem('newUserGuidanceCompleted', 'true');
//
//     // 显示功能提示
//     showFeatureTooltips();
// }
//
// // 显示功能提示（已移除）
// function showFeatureTooltips() {
//     // 显示计时器提示
//     state.showTimerTooltip = true;
//     elements.timerTooltip.style.display = 'block';
//
//     // 3秒后显示打卡提示
//     setTimeout(() => {
//         state.showTimerTooltip = false;
//         elements.timerTooltip.style.display = 'none';
//
//         state.showCheckinTooltip = true;
//         elements.checkinTooltip.style.display = 'block';
//     }, 3000);
//
//     // 再过3秒显示SOS提示
//     setTimeout(() => {
//         state.showCheckinTooltip = false;
//         elements.checkinTooltip.style.display = 'none';
//
//         state.showSosTooltip = true;
//         elements.sosTooltip.style.display = 'block';
//     }, 6000);
//
//     // 最后显示进度提示
//     setTimeout(() => {
//         state.showSosTooltip = false;
//         elements.sosTooltip.style.display = 'none';
//
//         state.showProgressTooltip = true;
//         elements.progressTooltip.style.display = 'block';
//     }, 9000);
//
//     // 5秒后关闭所有提示
//     setTimeout(() => {
//         closeAllTooltips();
//     }, 14000);
// }
//
// // 关闭所有提示（已移除）
// function closeAllTooltips() {
//     state.showTimerTooltip = false;
//     state.showCheckinTooltip = false;
//     state.showSosTooltip = false;
//     state.showCommunityTooltip = false;
//     state.showProgressTooltip = false;
//
//     elements.timerTooltip.style.display = 'none';
//     elements.checkinTooltip.style.display = 'none';
//     elements.sosTooltip.style.display = 'none';
//     elements.progressTooltip.style.display = 'none';
// }

// 每日打卡功能
function onDailyCheckIn() {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD格式

    // 检查是否已经打卡过
    if (state.lastCheckinDate === today) {
        alert('今日已打卡');
        return;
    }

    // 检查是否连续打卡
    let newStreak = 1;
    if (state.lastCheckinDate) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (state.lastCheckinDate === yesterdayStr) {
            newStreak = state.checkinStreak + 1;
        }
        // 否则重置为1
    }

    // 更新打卡数据
    const checkinData = {
        streak: newStreak,
        lastCheckinDate: today
    };

    localStorage.setItem('checkinData', JSON.stringify(checkinData));

    state.checkinStreak = newStreak;
    state.lastCheckinDate = today;
    state.checkinButtonText = '📅 今日已打卡';

    elements.checkinButton.textContent = state.checkinButtonText;
    elements.checkinStreak.style.display = 'block';
    elements.streakDays.textContent = newStreak;

    // 显示鼓励消息
    let message = '打卡成功！';
    if (newStreak === 3) {
        message = '🎖️ 获得3天连续守护勋章！';
    } else if (newStreak === 7) {
        message = '🏆 获得7天连续守护勋章！';
    } else if (newStreak === 21) {
        message = '👑 获得21天连续守护勋章！';
    }

    alert(message + `\n你已经连续守护${newStreak}天！`);
}

// SOS紧急干预
function onSOS() {
    // 立即显示AI提醒
    showAIEncouragement();

    // 模拟请求 AI 大模型接口
    setTimeout(() => {
        // 倒计时干预：强制进入一个60秒的深呼吸倒计时页面
        const confirmed = confirm(`当前有${state.onlineCount}位战友正在共同守护，你不是一个人在战斗！\n\n点击确定开始60秒深呼吸倒计时，阻断冲动回路。`);

        if (confirmed) {
            // 更新全局在线人数数据
            app.globalData.onlineCount = state.onlineCount;

            // 跳转到深呼吸页面，传递SOS标志
            window.location.href = 'breathing.html?fromSOS=true';
        } else {
            // 显示鼓励语
            showAIEncouragement();
        }
    }, 1500);
}

// 显示AI鼓励语
function showAIEncouragement() {
    const encouragements = [
        "深呼吸，这股冲动通常只持续10分钟。你已经做得很好了！",
        "记住，每一次克制都是成长的机会。相信自己！",
        "想想你坚持到现在的努力，这一点点冲动不算什么！",
        "你正在重新掌控自己的人生，这种感觉多么棒！",
        "每一次战胜诱惑，都是在变得更强大！",
        "冲动正在消退，你正在变得更强大！",
        "你不是一个人在战斗，我们都在支持你！",
        "每一秒的坚持都是胜利，继续加油！"
    ];

    const randomMessage = encouragements[Math.floor(Math.random() * encouragements.length)];
    alert('🤖 AI 守护者提醒\n\n' + randomMessage);
}

// 重置计时器
function onReset(event) {
    // 阻止默认右键菜单
    event.preventDefault();

    // 精准计算当前时间
    const now = Date.now();
    const currentStartTime = state.startTime || parseInt(localStorage.getItem('startTime'));
    const diff = now - currentStartTime; // 计算毫秒差值

    // 将毫秒转换为更易读的格式
    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor((totalSeconds % 60));

    // 显示更精确的确认信息
    const timeText = `${days}天${hours}小时${minutes}分${seconds}秒`;

    const confirmed = confirm(`确定要重置吗？\n你已坚持 ${timeText}，确定要清零吗？`);

    if (confirmed) {
        // 停止首页定时器
        if (state.timer) {
            clearInterval(state.timer);
            state.timer = null;
        }

        // 保存复盘数据
        const reviews = JSON.parse(localStorage.getItem('reviewHistory')) || [];
        reviews.push({
            date: new Date().toISOString(),
            days: days,
            hours: hours,
            minutes: minutes,
            seconds: seconds,
            totalSeconds: totalSeconds
        });
        localStorage.setItem('reviewHistory', JSON.stringify(reviews));

        // 跳转到反思页面，传递时间数据
        window.location.href = `review.html?days=${days}&hours=${hours}&minutes=${minutes}&seconds=${seconds}&totalSeconds=${totalSeconds}`;

        // 注意：不需要重新启动定时器，因为页面已经跳转
        // 计时器将在反思页面保存后重置
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initializeApp);

// 页面可见性变化处理
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') {
        // 页面隐藏时暂停在线人数更新，节省资源
        if (state.onlineCountTimer) {
            clearInterval(state.onlineCountTimer);
            state.onlineCountTimer = null;
        }
    } else {
        // 页面显示时重新启动在线人数定时器
        if (!state.onlineCountTimer) {
            startOnlineCountTimer();
        }
    }
});

// 页面卸载时清理所有定时器
window.addEventListener('beforeunload', function() {
    // 页面卸载时清理所有定时器
    if (state.timer) {
        clearInterval(state.timer);
        state.timer = null;
    }
    if (state.onlineCountTimer) {
        clearInterval(state.onlineCountTimer);
        state.onlineCountTimer = null;
    }
});
