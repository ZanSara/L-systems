import { createApp } from 'vue'
import App from './App.vue'
import NoWebGL from './NoWebGL';
import {isWebGLEnabled} from 'w-gl';

let canRender = isWebGLEnabled(document.querySelector('#scene'));

createApp(canRender ? App : NoWebGL).mount('#app')
