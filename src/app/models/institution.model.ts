export enum TypeInstitution {
    EMETTRICE = 'EMETTRICE',
    ACQUEREUSE = 'ACQUEREUSE',
    CENTRE = 'CENTRE',
    PORTEFEUILLE = 'PORTEFEUILLE'
  }
  
  export interface Institution {
    id?: number;
    nom: string;
    type: TypeInstitution;
    enabled?: boolean;
  }
  