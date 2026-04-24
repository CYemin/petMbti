import { AXIS_META, QUESTION_BANK_BY_TYPE, TYPE_PROFILES } from "./mbti-data.js";

const POSTER_LINK = "https://cyemin.github.io/petMbti/";
const RESULT_OBSERVATION_TEXT =
  "这份结果综合了社交启动方式、新鲜刺激偏好、情绪回应习惯和日常节奏接受度四个维度，更适合当作理解毛孩子沟通风格的小标签，而不是医疗或行为诊断。";

const quizRoot = document.querySelector("[data-quiz-root]");

if (quizRoot) {
  initQuiz();
}

function initQuiz() {
  const landingCover = document.querySelector("[data-landing-cover]");
  const startButton = document.querySelector("[data-start-quiz]");
  const form = document.querySelector("[data-quiz-form]");
  const basicMedia = document.querySelector("[data-basic-media]");
  const stepContent = document.querySelector("[data-step-content]");
  const resultPanel = document.querySelector("[data-result-panel]");
  const resultContent = document.querySelector("[data-result-content]");
  const progressFill = document.querySelector("[data-progress-fill]");
  const stepKicker = document.querySelector("[data-step-kicker]");
  const stepCount = document.querySelector("[data-step-count]");
  const prevButton = document.querySelector("[data-prev-step]");
  const nextButton = document.querySelector("[data-next-step]");
  const restartButton = document.querySelector("[data-restart-quiz]");
  const photoInput = document.querySelector("[data-pet-photo-input]");
  const photoPreview = document.querySelector("[data-photo-preview]");
  const photoEmpty = document.querySelector("[data-photo-empty]");
  const photoPreviewImage = document.querySelector("[data-photo-preview-image]");
  const photoPreviewName = document.querySelector("[data-photo-preview-name]");

  if (
    !landingCover ||
    !startButton ||
    !form ||
    !stepContent ||
    !resultPanel ||
    !resultContent ||
    !progressFill ||
    !stepKicker ||
    !stepCount ||
    !prevButton ||
    !nextButton ||
    !restartButton ||
    !photoInput ||
    !photoPreview ||
    !photoEmpty ||
    !photoPreviewImage ||
    !photoPreviewName
  ) {
    return;
  }

  const state = {
    step: 0,
    basics: {
      petName: "",
      petType: "",
    },
    photo: {
      objectUrl: "",
      name: "",
    },
    answers: {},
    questionSet: createQuestionSet("哈基咪"),
    lastResult: null,
  };

  renderStep();
  syncPhotoPreview();

  form.hidden = true;

  photoInput.addEventListener("change", function (event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !target.files || !target.files[0]) {
      return;
    }

    const file = target.files[0];
    if (state.photo.objectUrl) {
      URL.revokeObjectURL(state.photo.objectUrl);
    }

    state.photo.objectUrl = URL.createObjectURL(file);
    state.photo.name = file.name;
    syncPhotoPreview();
    updateActionState();
  });

  prevButton.addEventListener("click", function () {
    if (state.step > 0) {
      state.step -= 1;
      renderStep();
    }
  });

  form.addEventListener("input", function (event) {
    const target = event.target;

    if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLSelectElement)) {
      return;
    }

    if (target.name in state.basics) {
      state.basics[target.name] = target.value;
      updateActionState();
      return;
    }

    if (target.type === "radio") {
      state.answers[target.name] = Number(target.value);
      updateActionState();

      window.setTimeout(function () {
        if (isQuestionStep() && hasCurrentAnswer()) {
          goNext();
        }
      }, 180);
    }
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    goNext();
  });

  startButton.addEventListener("click", function () {
    landingCover.hidden = true;
    form.hidden = false;
    form.classList.add("is-visible");
    renderStep();
  });

  restartButton.addEventListener("click", function () {
    state.step = 0;
    state.answers = {};
    state.questionSet = createQuestionSet("哈基咪");
    state.lastResult = null;
    resultPanel.hidden = true;
    form.hidden = true;
    landingCover.hidden = false;
    quizRoot.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  function renderStep() {
    const totalSteps = state.questionSet.length + 1;
    const progressPercent = ((state.step + 1) / totalSteps) * 100;

    progressFill.style.width = progressPercent + "%";
    prevButton.hidden = state.step === 0;
    basicMedia.hidden = state.step !== 0;

    if (state.step === 0) {
      stepKicker.textContent = "准备信息";
      stepCount.textContent = `第 1 / ${totalSteps} 步`;
      nextButton.textContent = "开始答题";
      stepContent.innerHTML = renderBasicsStep();
    } else {
      const question = state.questionSet[state.step - 1];
      stepKicker.textContent = "正在答题";
      stepCount.textContent = `第 ${state.step + 1} / ${totalSteps} 步`;
      nextButton.textContent = state.step === state.questionSet.length ? "查看结果" : "下一题";
      stepContent.innerHTML = renderQuestionStep(question, state.step - 1);
    }

    updateActionState();
  }

  function renderBasicsStep() {
    return `
      <div class="wizard-step">
        <span class="step-badge">基础资料</span>
        <h2>给这位主角补充一下基本信息。</h2>
        <p class="step-note">照片会出现在结果海报里，名字和类型会帮助结果更有代入感。</p>

        <div class="field-grid">
          <label class="field">
            <span>宠物名字</span>
            <input
              type="text"
              name="petName"
              placeholder="例如：豆沙包、豆花"
              value="${escapeAttr(state.basics.petName)}"
              required
            />
          </label>

          <label class="field">
            <span>宠物类型</span>
            <select name="petType" required>
              ${renderSelectOptions(
                ["", "哈基咪", "哈基汪"],
                state.basics.petType
              )}
            </select>
          </label>
        </div>
      </div>
    `;
  }

  function renderQuestionStep(question, index) {
    const currentValue = state.answers[question.id];

    return `
      <div class="wizard-step">
        <div class="question-topline">
          <span class="step-badge">问题 ${index + 1}</span>
        </div>
        <h2>${question.title}</h2>

        <div class="choice-grid">
          ${question.choices
            .map(function (choice) {
              const checked = currentValue === choice.value ? "checked" : "";
              return `
                <label class="choice-card">
                  <input
                    type="radio"
                    name="${question.id}"
                    value="${choice.value}"
                    ${checked}
                  />
                  <span class="choice-title">${choice.label}</span>
                  <small>${choice.desc}</small>
                </label>
              `;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  function renderResult() {
    const scores = buildScores(state.questionSet, state.answers);
    const letters = [
      scores.EI >= 0 ? "E" : "I",
      scores.SN >= 0 ? "N" : "S",
      scores.TF >= 0 ? "F" : "T",
      scores.JP >= 0 ? "P" : "J",
    ].join("");

    const profile = pickRandom(TYPE_PROFILES[letters].variants);
    const dimensionItems = buildDimensionSummaries(scores);
    const tips = buildTips(letters, state.basics);
    const tags = buildTags(letters, profile, state.basics);
    const palette = getPosterPalette(letters);
    const petVisual = renderPetVisual(state);

    state.lastResult = {
      letters,
      profile,
      petType: state.basics.petType,
      petName: state.basics.petName,
      tags,
      tips,
      dimensionItems,
      palette,
      observationText: RESULT_OBSERVATION_TEXT,
    };

    resultContent.innerHTML = `
      <div class="poster-card" style="--poster-accent:${palette.accent}; --poster-soft:${palette.soft};">
        <div class="poster-grid">
          <div class="poster-photo-frame">
            ${petVisual}
          </div>
          <div class="poster-copy">
            <span class="poster-kicker">毛孩子人格海报</span>
            <h2 class="poster-title">${letters}</h2>
            <p class="poster-nickname">${profile.nickname}</p>
            <p class="poster-plain">${profile.plainTalk}</p>
          </div>
        </div>
        <p class="poster-link">${POSTER_LINK}</p>
      </div>

      <div class="result-header">
        <div class="result-tags">
          ${tags
            .map(function (tag) {
              return `<span class="result-tag">${tag}</span>`;
            })
            .join("")}
        </div>
      </div>

      <div class="result-grid">
        <article class="result-box">
          <h3>性格总览</h3>
          <p>${profile.summary}</p>
          <p><strong>一句话：</strong>${profile.headline}</p>
          <p><strong>闪光点：</strong>${profile.spotlight}</p>
        </article>

        <article class="result-box">
          <h3>观察依据</h3>
          <p>${RESULT_OBSERVATION_TEXT}</p>
        </article>

        <div class="dimension-grid">
          ${dimensionItems
            .map(function (item) {
              return `
                <article class="dimension-item">
                  <h4>${item.title}</h4>
                  <p><strong>${item.label}</strong></p>
                  <p>${item.summary}</p>
                  <div class="bar-track">
                    <div class="bar-fill" style="width:${item.strength}%; background:${item.barColor};"></div>
                  </div>
                </article>
              `;
            })
            .join("")}
        </div>

        <div class="tips-grid">
          <article class="result-box">
            <h3>主人日常建议</h3>
            <ul class="tip-list">
              ${tips.owner
                .map(function (tip) {
                  return `<li>${tip}</li>`;
                })
                .join("")}
            </ul>
          </article>

          <article class="result-box">
            <h3>互动建议</h3>
            <ul class="tip-list">
              ${tips.play
                .map(function (tip) {
                  return `<li>${tip}</li>`;
                })
                .join("")}
            </ul>
          </article>
        </div>
      </div>
    `;

    form.hidden = true;
    resultPanel.hidden = false;
    resultPanel.classList.add("is-visible");
    resultPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function updateActionState() {
    if (state.step === 0) {
      nextButton.disabled = !isBasicsComplete();
      return;
    }

    nextButton.disabled = !hasCurrentAnswer();
  }

  function goNext() {
    if (state.step === 0 && !isBasicsComplete()) {
      return;
    }

    if (isQuestionStep() && !hasCurrentAnswer()) {
      return;
    }

    if (state.step < state.questionSet.length) {
      if (state.step === 0) {
        state.questionSet = createQuestionSet(state.basics.petType);
      }
      state.step += 1;
      renderStep();
      return;
    }

    renderResult();
  }

  function isBasicsComplete() {
    return Boolean(state.basics.petName.trim() && state.basics.petType);
  }

  function isQuestionStep() {
    return state.step > 0 && state.step <= state.questionSet.length;
  }

  function hasCurrentAnswer() {
    if (!isQuestionStep()) {
      return false;
    }

    const currentQuestion = state.questionSet[state.step - 1];
    return Number.isFinite(state.answers[currentQuestion.id]);
  }

  function syncPhotoPreview() {
    if (!state.photo.objectUrl) {
      photoPreview.hidden = true;
      photoEmpty.hidden = false;
      photoPreviewImage.removeAttribute("src");
      photoPreviewName.textContent = "";
      return;
    }

    photoPreview.hidden = false;
    photoEmpty.hidden = true;
    photoPreviewImage.src = state.photo.objectUrl;
    photoPreviewName.textContent = state.photo.name || "已上传照片";
  }
}

function createQuestionSet(petType) {
  return getQuestionBankForType(petType).map(function (question) {
    return {
      ...question,
      title: pickRandom(question.prompts),
    };
  });
}

function buildScores(questionSet, answers) {
  const scores = {
    EI: 0,
    SN: 0,
    TF: 0,
    JP: 0,
  };

  questionSet.forEach(function (question) {
    scores[question.dimension] += answers[question.id] - 3;
  });

  return scores;
}

function buildDimensionSummaries(scores) {
  const barPalette = {
    EI: "#f58bc0",
    SN: "#7ec8ff",
    TF: "#ffbf72",
    JP: "#97a7ff",
  };

  return Object.entries(AXIS_META).map(function ([dimension, meta]) {
    const score = scores[dimension];
    const letter = score >= 0 ? getRightPole(dimension) : getLeftPole(dimension);
    const summary = meta.letters[letter];
    const strength = Math.min(100, Math.round((Math.abs(score) / 6) * 100) + 18);

    return {
      title: meta.title,
      label: summary.label,
      summary: summary.summary,
      strength,
      barColor: barPalette[dimension] || "#97a7ff",
    };
  });
}

function buildTips(type, basics) {
  const letters = type.split("");
  const axisTips = [
    AXIS_META.EI.letters[letters[0]].tip,
    AXIS_META.SN.letters[letters[1]].tip,
    AXIS_META.TF.letters[letters[2]].tip,
    AXIS_META.JP.letters[letters[3]].tip,
  ];

  return {
    owner: [
      axisTips[0],
      axisTips[2],
      basics.petType === "哈基咪"
        ? "如果它偏慢热或结构感强，记得准备稳定躲藏点、高处休息位和可预期的互动距离。"
        : "如果它互动需求高，可以把遛弯、陪玩和训练拆成短而频的几轮，通常会更舒服。",
      "如果最近行为和这份画像差异特别大，优先排查健康、环境压力和作息变化。",
    ],
    play: [
      axisTips[1],
      axisTips[3],
      letters[2] === "F"
        ? "互动时多用语气、眼神和夸奖强化安全感，它通常会比单纯命令更愿意配合。"
        : "给它设计带目标的小任务，比如找零食、定点取物或简单障碍，会更有成就感。",
      "每次尝试新训练时，都建议先从低刺激环境开始，再慢慢增加变化，成功率通常更高。",
    ],
  };
}

function buildTags(type, profile, basics) {
  return [`昵称：${profile.nickname}`, `类型：${type}`, `${basics.petType}观察样本`];
}

function getLeftPole(dimension) {
  return getQuestionBankForType("哈基咪").find(function (question) {
    return question.dimension === dimension;
  }).leftPole;
}

function getRightPole(dimension) {
  return getQuestionBankForType("哈基咪").find(function (question) {
    return question.dimension === dimension;
  }).rightPole;
}

function getQuestionBankForType(petType) {
  return QUESTION_BANK_BY_TYPE[petType] || QUESTION_BANK_BY_TYPE["哈基咪"];
}

function renderPetVisual(state) {
  if (state.photo.objectUrl) {
    return `
      <img
        class="result-photo"
        src="${state.photo.objectUrl}"
        alt="${escapeAttr(state.basics.petName || "毛孩子")}的照片"
      />
    `;
  }

  return `
    <div class="result-photo result-photo-fallback" role="img" aria-label="宠物图片占位">
      <span>Pet</span>
    </div>
  `;
}

function renderSelectOptions(options, selected) {
  return options
    .map(function (option) {
      const value = option === "" ? "" : option;
      const label = option === "" ? "请选择" : option;
      const isSelected = value === selected ? "selected" : "";
      return `<option value="${escapeAttr(value)}" ${isSelected}>${label}</option>`;
    })
    .join("");
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function drawBulletList(ctx, items, x, y, maxWidth, lineHeight, itemGap, bulletColor) {
  let currentY = y;

  items.forEach(function (item) {
    ctx.beginPath();
    ctx.fillStyle = bulletColor;
    ctx.arc(x + 6, currentY - 8, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#5f5a72";
    const lastY = wrapText(ctx, item, x + 24, currentY, maxWidth, lineHeight);
    currentY = lastY + itemGap;
  });

  return currentY - itemGap;
}

function drawSimpleSectionCard(ctx, config) {
  const headingSpace = 88;
  const bodyStartY = config.y + headingSpace;
  const bodyEndY = config.body(config.x + 32, bodyStartY, config.width - 64);
  const height = Math.max(headingSpace + 40, bodyEndY - config.y + 34);

  roundRect(ctx, config.x, config.y, config.width, height, 24, "#ffffff");
  strokeRoundedRect(ctx, config.x, config.y, config.width, height, 24, "#e5e7eb", 2);
  ctx.fillStyle = "#111827";
  ctx.font = "800 34px 'Microsoft YaHei', 'Segoe UI', sans-serif";
  ctx.fillText(config.title, config.x + 32, config.y + 54);

  config.body(config.x + 32, bodyStartY, config.width - 64);
  return config.y + height;
}

function drawParagraphBlock(ctx, paragraphs, x, y, maxWidth, lineHeight, paragraphGap) {
  let currentY = y;
  paragraphs.forEach(function (paragraph) {
    currentY = wrapText(ctx, paragraph, x, currentY, maxWidth, lineHeight) + paragraphGap;
  });
  return currentY - paragraphGap;
}

function measureParagraphBlockHeight(ctx, paragraphs, maxWidth, lineHeight, paragraphGap) {
  return paragraphs.reduce(function (total, paragraph, index) {
    return (
      total +
      measureWrappedTextHeight(ctx, paragraph, maxWidth, lineHeight) +
      (index === paragraphs.length - 1 ? 0 : paragraphGap)
    );
  }, 0);
}

function measureWrappedTextHeight(ctx, text, maxWidth, lineHeight) {
  const chars = Array.from(text);
  let line = "";
  let lines = 1;

  chars.forEach(function (char) {
    const testLine = line + char;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines += 1;
      line = char;
    } else {
      line = testLine;
    }
  });

  return lines * lineHeight;
}

function measureBulletListHeight(ctx, items, maxWidth, lineHeight, itemGap) {
  return items.reduce(function (total, item, index) {
    return (
      total +
      measureWrappedTextHeight(ctx, item, maxWidth - 24, lineHeight) +
      (index === items.length - 1 ? 0 : itemGap)
    );
  }, 0);
}

function drawSoftGlow(ctx, x, y, radius, color) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function roundRect(ctx, x, y, width, height, radius, fillStyle) {
  ctx.save();
  roundedPath(ctx, x, y, width, height, radius);
  ctx.fillStyle = fillStyle;
  ctx.fill();
  ctx.restore();
}

function strokeRoundedRect(ctx, x, y, width, height, radius, strokeStyle, lineWidth) {
  ctx.save();
  roundedPath(ctx, x, y, width, height, radius);
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
  ctx.restore();
}

function roundedPath(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const chars = Array.from(text);
  let line = "";
  let currentY = y;

  chars.forEach(function (char) {
    const testLine = line + char;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = char;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  });

  if (line) {
    ctx.fillText(line, x, currentY);
  }

  return currentY;
}

function drawCoverImage(ctx, src, box) {
  return new Promise(function (resolve, reject) {
    const image = new Image();
    image.onload = function () {
      ctx.save();
      roundedPath(ctx, box.x, box.y, box.w, box.h, box.r);
      ctx.clip();

      const imgRatio = image.width / image.height;
      const boxRatio = box.w / box.h;
      let drawWidth = box.w;
      let drawHeight = box.h;
      let offsetX = box.x;
      let offsetY = box.y;

      if (imgRatio > boxRatio) {
        drawWidth = box.h * imgRatio;
        offsetX = box.x - (drawWidth - box.w) / 2;
      } else {
        drawHeight = box.w / imgRatio;
        offsetY = box.y - (drawHeight - box.h) / 2;
      }

      ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
      ctx.restore();
      resolve();
    };
    image.onerror = reject;
    image.src = src;
  });
}

function getPosterPalette(type) {
  if (type[1] === "N" && type[2] === "T") {
    return {
      accent: "#9d8cff",
      secondary: "#8fd6ff",
      soft: "#efeaff",
      bgStart: "#f8f6ff",
      bgEnd: "#fdfcff",
      title: "#2f2450",
      kicker: "#6d5eb0",
      text: "#5c5874",
    };
  }

  if (type[1] === "N" && type[2] === "F") {
    return {
      accent: "#ff96bf",
      secondary: "#9fe3d1",
      soft: "#fff0f7",
      bgStart: "#fff8fb",
      bgEnd: "#f9fffc",
      title: "#3b2343",
      kicker: "#b0537f",
      text: "#62586a",
    };
  }

  if (type[1] === "S" && type[3] === "J") {
    return {
      accent: "#7fa7ff",
      secondary: "#ffd28a",
      soft: "#eef4ff",
      bgStart: "#f8fbff",
      bgEnd: "#fffaf4",
      title: "#24334f",
      kicker: "#5670b0",
      text: "#5a6477",
    };
  }

  return {
    accent: "#ff9d7a",
    secondary: "#89d7d1",
    soft: "#fff1ec",
    bgStart: "#fffaf7",
    bgEnd: "#f6fffe",
    title: "#432d27",
    kicker: "#b66a4a",
    text: "#685c57",
  };
}

function hexToRgba(hex, alpha) {
  const clean = hex.replace("#", "");
  const value = clean.length === 3 ? clean.split("").map((char) => char + char).join("") : clean;
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
