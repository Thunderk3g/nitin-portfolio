import "server-only";
import { cache } from "react";
import { getSiteContent } from "@/lib/db/queries";

/** One site_content read per request, shared by generateMetadata and the page. */
export const loadSiteContent = cache(getSiteContent);
