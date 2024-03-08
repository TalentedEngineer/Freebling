
export interface Campaigns {
    title : string;
    startDate : Date;
    endDate : Date;
    timezone : string;
    restrictedCountries : [];
    age : number;
    requiredFields : [];
    loginOptions : [];
    optionalFields : [] ;
    taskName : string;
    redirectLink : string;
    noOfEntries : number;
    dailyTask : boolean;
    prizeName : string;
    noOfWinnners : number;
    prizeValue : string;
    description : string;
    imageUrl : string;
}

