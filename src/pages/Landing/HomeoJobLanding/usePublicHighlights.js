import { useEffect, useState } from "react";
import { getPublicHighlights } from "../../../helpers/publicBookingApi";

export const formatCount = (value) => Number(value || 0).toLocaleString("en-IN");

/** Live directory numbers and approved reviews; null until loaded or when the API fails. */
const usePublicHighlights = () => {
    const [highlights, setHighlights] = useState(null);

    useEffect(() => {
        let cancelled = false;
        getPublicHighlights()
            .then((data) => {
                if (!cancelled) setHighlights(data || null);
            })
            .catch(() => {
                if (!cancelled) setHighlights(null);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    return highlights;
};

export default usePublicHighlights;
