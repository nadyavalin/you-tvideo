const APY_KEY = "AIzaSyDQXM6WhonrBkUovsstbs1yNSIKj39EmW4";
const VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos";
// const SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";

const favoriteIds = JSON.parse(localStorage.getItem("favoriteYT") || "[]");

const videoListItems = document.querySelector(".video-list__items");

const convertISOToReadableDuration = (isoDuration) => {
  const hoursMatch = isoDuration.match(/(\d+)H/);
  const minutesMatch = isoDuration.match(/(\d+)M/);
  const secondsMatch = isoDuration.match(/(\d+)S/);

  const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
  const seconds = secondsMatch ? parseInt(secondsMatch[1], 10) : 0;

  let result = "";

  if (hours > 0) {
    result += `${hours} ч `;
  }

  if (minutes > 0) {
    result += `${minutes} мин `;
  }

  if (seconds > 0) {
    result += `${seconds} сек`;
  }

  return result.trim();
};

const formatDate = (isoString) => {
    const date = new Date(isoString);
    const formatter = new Intl.DateTimeFormat('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
    return formatter.format(date);
}

const fetchTrendingVideos = async () => {
  try {
    const url = new URL(VIDEOS_URL);

    url.searchParams.append("part", "contentDetails,id,snippet");
    url.searchParams.append("chart", "mostPopular");
    url.searchParams.append("regionCode", "RU");
    url.searchParams.append("maxResults", 12);
    url.searchParams.append("key", APY_KEY);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("error:", error);
    return null;
  }
};

const fetchFavoriteVideos = async () => {
  try {
    if (favoriteIds.length === 0) {
      return { items: [] };
    }
    const url = new URL(VIDEOS_URL);

    url.searchParams.append("part", "contentDetails,id,snippet");
    url.searchParams.append("maxResults", 12);
    url.searchParams.append("id", favoriteIds.join(","));
    url.searchParams.append("key", APY_KEY);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("error:", error);
    return null;
  }
};

const fetchVideoData = async (id) => {
  try {
    const url = new URL(VIDEOS_URL);

    url.searchParams.append("part", "snippet,statistics");
    url.searchParams.append("id", id);
    url.searchParams.append("key", APY_KEY);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("error:", error);
    return null;
  }
};

const displayListVideo = (videos) => {
  videoListItems.textContent = "";

  const listVideos = videos.items.map((video) => {
    const li = document.createElement("li");
    li.classList.add("video-list__item");
    li.innerHTML = `
        <article class="video-card">
            <a class="video-card__link" href="video.html?id=${video.id}">
                <img class="video-card__thumbnail" src="${
                  video.snippet.thumbnails.standard?.url ||
                  video.snippet.thumbnails.high?.url
                }" alt="${video.snippet.title}">
                <h3 class="video-card__title">${video.snippet.title}</h3>
                <p class="video-card__channel">${video.snippet.channelTitle}</p>
                <p class="video-card__duration">${convertISOToReadableDuration(
                  video.contentDetails.duration
                )}</p>
            </a>
            <button class="video-card__favorite favorite ${
              favoriteIds.includes(video.id) ? "active" : ""
            }" type="button" aria-label="Добавить в избранное ${
              video.snippet.title
            }" data-video-id="${video.id}">
                <svg class="video-card__icon">
                    <use class="star-o" xlink:href="./image/sprite.svg#star-ob"></use>
                    <use class="star" xlink:href="./image/sprite.svg#star"></use>
                </svg>
            </button>
        </article>
        `;
    return li;
  });

  videoListItems.append(...listVideos);
};

const displayVideo = ({ items: [video] }) => {
  const videoElem = document.querySelector(".video");
  videoElem.innerHTML = `
    <div class="container">
                <div class="video__player">
                    <iframe class="video__iframe" src="https://www.youtube.com/embed/${video.id}" frameborder="0"
                        allowfullscreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"></iframe>
                </div>
                <div class="video__container">
                    <div class="video__content">
                        <h2 class="video__title">${video.snippet.title}</h2>
                        <p class="video__channel">${video.snippet.channelTitle}</p>
                        <p class="video__info">
                            <span class="video__views">${parseInt(
                                video.statistics.viewCount, 10
                                ).toLocaleString()} просмотров</span>
                            <span class="video__date">Дата премьеры: ${formatDate(
                                video.snippet.publishedAt,
                            )}</span>
                        </p>
                        <p class="video__description">${video.snippet.description}</p>
                    </div>
                    <button href="" class="video__link favorite ${
                        favoriteIds.includes(video.id) ? "active" : ""
                      }" href="favorite.html">
                        <span class="video__no-favorite">Добавить в избранное</span>
                        <span class="video__favorite">В избранном</span>
                        <svg class="video__icon">
                            <use xlink:href="./image/sprite.svg#star-ob"></use>
                        </svg>
                    </button>
                </div>
            </div>
    `;
};

const init = () => {
  const currentPage = window.location.pathname.split("/").pop();
  const urlSearchParams = new URLSearchParams(window.location.search);
  const videoId = urlSearchParams.get("id");
  const searchQuery = urlSearchParams.get("q");

  if (currentPage === "index.html" || currentPage === "") {
    fetchTrendingVideos().then(displayListVideo);
  } else if (currentPage === "video.html" && videoId) {
    fetchVideoData(videoId).then(displayVideo);
  } else if (currentPage === "favorite.html") {
    fetchFavoriteVideos().then(displayListVideo);
  } else if (currentPage === "search.html" && searchQuery) {
    console.log(currentPage);
  }

  document.body.addEventListener("click", ({ target }) => {
    const itemFavorite = target.closest(".favorite");

    if (itemFavorite) {
      const video = itemFavorite.dataset.videoId;

      if (favoriteIds.includes(video)) {
        favoriteIds.splice(favoriteIds.indexOf(video), 1);
        localStorage.setItem("favoriteYT", JSON.stringify(favoriteIds));
        itemFavorite.classList.remove("active");
      } else {
        favoriteIds.push(video);
        localStorage.setItem("favoriteYT", JSON.stringify(favoriteIds));
        itemFavorite.classList.add("active");
      }
    }
  });
};

init();
