"use client";

import { BlindBoxShowcase } from "./_components/BlindBoxShowcase";
import { HeroSection } from "./_components/HeroSection";
import { LiveActivity } from "./_components/LiveActivity";
import { RarityShowcase } from "./_components/RarityShowcase";
import { RevealProcess } from "./_components/RevealProcess";
import { StakingArchitecture } from "./_components/StakingArchitecture";
import { StatsDashboard } from "./_components/StatsDashboard";
import type { NextPage } from "next";

const Home: NextPage = () => {
  return (
    <>
      <HeroSection />
      <BlindBoxShowcase />
      <RarityShowcase />
      <LiveActivity />
      <RevealProcess />
      <StakingArchitecture />
      <StatsDashboard />
    </>
  );
};

export default Home;
