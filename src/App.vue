<script setup lang="ts"></script>

<template>
  <transition name="fade-slide" mode="out-in">
    <RouterView />
  </transition>
</template>

<style>
/* App-specific styles only */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    opacity 300ms ease,
    transform 300ms ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
