"use client"

import { Foot } from "@/components/foot";
import Hero from "@/components/hero";
import { InputWithButton } from "@/components/input/input-with-button";
import Wallpapers from "@/components/wallpapers";

export default function Home() {
  return (
    <main>
      <Hero/>
      <InputWithButton 
        placeholder="描述你的封面，比如贪吃蛇,漫画风格"
        buttonText="生成"
      />
      <Wallpapers/>
      <Foot/>
    </main>
  )
}
