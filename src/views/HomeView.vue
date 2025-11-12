<template>
  <div class="home">
    <div class="title">
      <h1>漂流瓶小游戏</h1>
    </div>
    <div class="buttons">
      <button class="btn btn-primary" @click="startGame">漂流瓶游戏1</button>
      <button class="btn btn-secondary" @click="startGame2">漂流瓶游戏2</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HomeView',
  methods: {
    startGame() {
      this.$router.push('/game')
    },
    startGame2() {
      this.$router.push('/game2')
    }
  }
}
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(to bottom, #87CEEB, #1E90FF);
}

.title {
  margin-bottom: 50px;
  text-align: center;
}

.title h1 {
  font-size: 2.5rem;
  color: white;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.buttons {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.btn {
  font-size: 1.2rem;
  padding: 15px 40px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background-color: #4CAF50;
  color: white;
}

.btn-secondary {
  background-color: #2196F3;
  color: white;
}

.btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}
</style>
