import React, {  useState } from 'react'
import PreviewData from '../../../components/PreviewData';
import { useAuth } from '../../../context/authcontext';
import MainLayout from '../../../components/Layouts/MainLayout';
import Loader from '../../../components/loader';
import PreviewDataOriginal from '../../../components/PreviewDataOriginal';

export default function edit() {
    const {data } = useAuth();
  return (
    <MainLayout>
      {/* profile top */}
      <div className="flex flex-row w-full items-center max-w-6xl mx-auto">
        <PreviewData data={data}/>
      </div>
    </MainLayout>
  )
}
