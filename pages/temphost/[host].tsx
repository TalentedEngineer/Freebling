import React from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import CardGiveaway from '../../components/CardGiveaway'
import { Tab, TabList } from 'react-tabs'

export default function businessProfile() {
    const router = useRouter()
    const id = router.query.id as string
    return (
        <div className="px-5 md:px-10 py-10 max-w-[1280px] mx-auto">
            {/* profile top */}
            <div className="flex flex-row w-full items-center">
                <div className="flex flex-col flex-1 items-center md:flex md:flex-row md:space-x-10">
                    <Image src="/assets/images/user_profile.png" className="align-center md:align-left w-full max-w-[160px] py-5" width={160} height={160} alt="Giveaeway featured image" />
                
                    <div className="flex flex-col w-full">
                        <div className="flex items-center justify-between py-2 text-white/60 font-medium text-sm md:text-xl">
                            <div className="">
                                <h3 className="text-xl font-Ubuntu-Bold text-white w-full md:text-2xl lg:w-auto">XMANNA</h3> www.xmanna.com
                            </div> 
                            <div className="text-xl font-Ubuntu-Bold text-teal-900 md:text-[48px] lg:w-auto text-center">1.2k<span className="block font-Ubuntu-Regular text-base md:text-lg text-white/60">Followers</span></div>
                        </div>
                        <div className="flex flex-col md:flex-row items-center space-y-5 md:space-y-0 md:space-x-8">
                            <button className="buttonPrimary m-0 py-1 w-full md:max-w-[200px]">Follow</button>
                            <p className="font-Ubuntu-Regular text-base md:text-xl m-0 p-0">Recieve notifications about giveaways</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* tabs and filters */}
            <div className="flex flex-col items-center justify-between my-10 pt-10 border-t-[1.5px] border-jade-900 space-y-5 md:space-y-0 md:flex-row">
                <TabList className="fbTabList grid_giveaway_tabs ">
                    <Tab className="fbTab rounded-sm hover:bg-jade-900"
                        selectedClassName="bg-jade-900 rounded-[7px]">Live</Tab>
                    <Tab className="fbTab rounded-sm bg-jade-900 hover:bg-jade-900 hover:border-none"
                        selectedClassName="bg-jade-900 rounded-[7px]">Upcoming</Tab>
                    <Tab className="fbTab rounded-sm hover:bg-jade-900 hover:border-none"
                        selectedClassName="bg-jade-900 rounded-[7px]">Ended</Tab>
                </TabList>
                <select className="w-full md:max-w-[160px] leading-[20px] text-white border-[1.5px] border-jade-100 rounded-full bg-transparent placeholder:text-black">
                    <option className="text-black" value="">Ending soon</option>
                    <option className="text-black" value="">Prize value</option>
                </select>
            </div>

            {/* giveaway cards */}
            <div className="w-full grid grid-cols-1 gap-10 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 my-5">
                <CardGiveaway/>
                <CardGiveaway/>
                <CardGiveaway/>
                <CardGiveaway/>
                <CardGiveaway/>
                <CardGiveaway/>
                <CardGiveaway/>
                <CardGiveaway/>
                <CardGiveaway/>
                <CardGiveaway/>
                <CardGiveaway/>
                <CardGiveaway/>
                <CardGiveaway/>
            </div>

        </div>
    )
}
