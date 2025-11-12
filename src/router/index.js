import { createRouter, createWebHashHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import GameView from "../views/GameView.vue";
import Game2View from "../views/Game2View.vue";

const routes = [
  {
    path: "/",
    name: "home",
    component: HomeView,
  },
  {
    path: "/game",
    name: "game",
    component: GameView,
  },
  {
    path: "/game2",
    name: "game2",
    component: Game2View,
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
