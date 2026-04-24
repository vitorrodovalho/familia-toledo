import familyData from "../../public/data/familia_toledo.json";
import type { RawFamilyData } from "./family";

const typedFamilyData = familyData as unknown as RawFamilyData;

void typedFamilyData;
