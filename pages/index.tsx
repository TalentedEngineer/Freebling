// pages/YourPage.jsx
import React from 'react';
import MainLayout from '../components/Layouts/MainLayout';
import TopCompanies from '../components/TopCompanies';
import HomeHero from '../components/Marketing/Followers/HomeHero';
import StartEarning from '../components/Marketing/StartEarning';
import CardGiveaway from '../components/Marketing/Cards/CardGiveaway';
import HomeHerov2 from '../components/HomeHerov2';

const HomePage = () => {
  return (
    <MainLayout>
      {/* Your page content goes here */}
      <HomeHerov2 />

      {/* <StartEarning />
      <TopCompanies />
      <div>
        <CardGiveaway />
      </div> */}
    </MainLayout>
  );
};

export default HomePage;