export type FormData = {
  clientName: string;
  email: string;
  phone: string;
  otherContact: string;
  address: string;
  brandName: string;
  slogan: string;
  description: string;
  targetAudience: string;
  deadline: string;
  serviceType: string[];
  graphicStyle: string[];
  selectedColors: string[];
  customColors: string;
  typography: string[];
  references: string;
};

export const initialFormData: FormData = {
  clientName: "",
  email: "",
  phone: "",
  otherContact: "",
  address: "",
  brandName: "",
  slogan: "",
  description: "",
  targetAudience: "",
  deadline: "",
  serviceType: [],
  graphicStyle: [],
  selectedColors: [],
  customColors: "",
  typography: [],
  references: "",
};
