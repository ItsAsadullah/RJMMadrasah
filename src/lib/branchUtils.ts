export const getBranchAddress = (branchId: number | string | undefined, branchesObj?: any) => {
    // If exact address from branches relation exists, use it
    if (branchesObj?.address) {
        return branchesObj.address;
    }
    
    const id = String(branchId);
    const branchName = branchesObj?.name || "";

    if (id === "1" || id === "6" || branchName.includes("হলিধানী")) {
        return "হলিধানী বাজার শাখা, ঝিনাইদহ সদর, ঝিনাইদহ";
    }
    if (id === "2" || id === "7" || branchName.includes("চাঁন্দুয়ালী") || branchName.includes("চান্দুয়ালী") || branchName.includes("চান্দুয়ালী")) {
        return "চাঁন্দুয়ালী বাজার শাখা, ঝিনাইদহ সদর, ঝিনাইদহ";
    }
    
    if (branchName) {
        return `${branchName}, ঝিনাইদহ সদর, ঝিনাইদহ`;
    }
    
    return "হলিধানী বাজার শাখা, ঝিনাইদহ সদর, ঝিনাইদহ";
};

export const getBranchPhone = (branchId: number | string | undefined, branchesObj?: any) => {
    if (branchesObj?.phone) {
        return branchesObj.phone;
    }
    
    const id = String(branchId);
    const branchName = branchesObj?.name || "";

    // If different branches have different phones, you can map them here.
    // Defaulting to the main one from StudentPrintProfile.
    return "০১৭১২-৫৪৬৭৯৩";
};
