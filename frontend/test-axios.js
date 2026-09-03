
const response = {
    data: {
        success: true,
        data: {
            summary: "Not enough",
            reason: "NOT_ENOUGH_REVIEWS"
        }
    }
};

const intercepted = (() => {
    if (response.data && typeof response.data === "object" && "data" in response.data) {
        if ("pagination" in response.data) {
            return {
                data: response.data.data,
                ...response.data.pagination
            };
        }
        return response.data.data;
    }
    return response.data;
})();

console.log("Intercepted:", intercepted);

const res = intercepted;
const finalRes = (() => {
    if (res && typeof res === "object" && "data" in res && res.data && typeof res.data === "object" && "summary" in res.data) {
        return res.data;
    }
    return res;
})();

console.log("Final Res:", finalRes);

