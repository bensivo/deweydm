import { EntityRecord } from "../models/entity-record.model";
import { Entity } from "../models/entity.model";

// Project Management
export const MOCK_ENTITIES: Entity[] =[
  {
    "id": "1772310521347-y5myyhl0j",
    "name": "Team Member",
    "pluralName": "Team Members",
    "fields": [
      {
        "id": "1772310529665-ksz8ea0sr",
        "name": "Name",
        "type": "short-text"
      },
      {
        "id": "1772310532882-g3us1fumg",
        "name": "Title",
        "type": "short-text"
      },
      {
        "id": "1772310556063-7fmtd2u2w",
        "name": "Team",
        "type": "reference",
        "referenceEntityId": "1772310544848-wq6e553q3"
      },
      {
        "id": "1772314567948-8fjutu8o8",
        "name": "Tasks",
        "type": "backlink",
        "backlinkSourceEntityId": "1772314402642-21mffrm6z",
        "backlinkSourceFieldId": "1772314420262-2afdzl91h"
      }
    ],
    "displayNameFieldId": "1772310529665-ksz8ea0sr"
  },
  {
    "id": "1772310544848-wq6e553q3",
    "name": "Team",
    "pluralName": "Teams",
    "fields": [
      {
        "id": "1772310614114-4xwtklm66",
        "name": "Name",
        "type": "short-text"
      }
    ]
  },
  {
    "id": "1772310624109-pk7op268b",
    "name": "Project",
    "pluralName": "Projects",
    "fields": [
      {
        "id": "1772310628695-557i0oaa3",
        "name": "Name",
        "type": "short-text"
      },
      {
        "id": "1772310649225-umgk8przz",
        "name": "Problem Statement",
        "type": "long-text"
      },
      {
        "id": "1772310676690-7nyjo5foq",
        "name": "Statement of Work",
        "type": "long-text"
      },
      {
        "id": "1772310687667-3c24aocrb",
        "name": "Team",
        "type": "reference",
        "referenceEntityId": "1772310544848-wq6e553q3"
      },
      {
        "id": "1772310706021-lhsg7gf8c",
        "name": "Time Estimate (working days)",
        "type": "number"
      },
      {
        "id": "1772314603984-hwyjxknbt",
        "name": "Tasks",
        "type": "backlink",
        "backlinkSourceEntityId": "1772314402642-21mffrm6z",
        "backlinkSourceFieldId": "1772314412911-b4fb98xsq"
      }
    ],
    "displayNameFieldId": "1772310628695-557i0oaa3"
  },
  {
    "id": "1772314402642-21mffrm6z",
    "name": "Task",
    "pluralName": "Tasks",
    "fields": [
      {
        "id": "1772314406157-j4k7c257l",
        "name": "Name",
        "type": "short-text"
      },
      {
        "id": "1772314412911-b4fb98xsq",
        "name": "Project",
        "type": "reference",
        "referenceEntityId": "1772310624109-pk7op268b"
      },
      {
        "id": "1772314420262-2afdzl91h",
        "name": "Assignees",
        "type": "reference-list",
        "referenceEntityId": "1772310521347-y5myyhl0j"
      }
    ]
  }
] 

export const MOCK_RECORDS: EntityRecord[] = []
// export const MOCK_RECORDS: EntityRecord[] = [
//   {
//     "id": "1772310970433-38txqtkwo",
//     "entityId": "1772310544848-wq6e553q3",
//     "data": {
//       "1772310614114-4xwtklm66": "MEDIAN"
//     }
//   },
//   {
//     "id": "1772310975099-v0fa6yy2x",
//     "entityId": "1772310544848-wq6e553q3",
//     "data": {
//       "1772310614114-4xwtklm66": "MODE"
//     }
//   },
//   {
//     "id": "1772311002084-m82j2yvc2",
//     "entityId": "1772310521347-y5myyhl0j",
//     "data": {
//       "1772310529665-ksz8ea0sr": "Eric Perez",
//       "1772310532882-g3us1fumg": "Data Engineer 1",
//       "1772310556063-7fmtd2u2w": "1772310970433-38txqtkwo"
//     }
//   },
//   {
//     "id": "1772311016163-oclk0tyh3",
//     "entityId": "1772310521347-y5myyhl0j",
//     "data": {
//       "1772310529665-ksz8ea0sr": "Thane Tate",
//       "1772310532882-g3us1fumg": "Associate Platform Engineer",
//       "1772310556063-7fmtd2u2w": "1772310970433-38txqtkwo"
//     }
//   },
//   {
//     "id": "1772311032372-fezkg98fc",
//     "entityId": "1772310521347-y5myyhl0j",
//     "data": {
//       "1772310529665-ksz8ea0sr": "Clifford Schomburg",
//       "1772310532882-g3us1fumg": "Manager, Data Platform",
//       "1772310556063-7fmtd2u2w": "1772310970433-38txqtkwo"
//     }
//   },
//   {
//     "id": "1772311047919-zq9c6zbed",
//     "entityId": "1772310521347-y5myyhl0j",
//     "data": {
//       "1772310529665-ksz8ea0sr": "Arnis",
//       "1772310532882-g3us1fumg": "Sr. Data Engineer",
//       "1772310556063-7fmtd2u2w": "1772310970433-38txqtkwo"
//     }
//   },
//   {
//     "id": "1772311063078-m4wfmwrmk",
//     "entityId": "1772310521347-y5myyhl0j",
//     "data": {
//       "1772310529665-ksz8ea0sr": "Chris Johnson",
//       "1772310532882-g3us1fumg": "Staff Platform Engineer",
//       "1772310556063-7fmtd2u2w": "1772310975099-v0fa6yy2x"
//     }
//   },
//   {
//     "id": "1772311073485-s2jvaw2uy",
//     "entityId": "1772310521347-y5myyhl0j",
//     "data": {
//       "1772310529665-ksz8ea0sr": "Jessica Han",
//       "1772310532882-g3us1fumg": "Software Engineer III",
//       "1772310556063-7fmtd2u2w": "1772310975099-v0fa6yy2x"
//     }
//   },
//   {
//     "id": "1772311095616-tjnyjtufr",
//     "entityId": "1772310521347-y5myyhl0j",
//     "data": {
//       "1772310529665-ksz8ea0sr": "Pete Harlan",
//       "1772310532882-g3us1fumg": "Sr. Platform Engineer",
//       "1772310556063-7fmtd2u2w": "1772310975099-v0fa6yy2x"
//     }
//   },
//   {
//     "id": "1772311160508-sgmcxi2ut",
//     "entityId": "1772310624109-pk7op268b",
//     "data": {
//       "1772310628695-557i0oaa3": "Databricks Workspace Deployment",
//       "1772310649225-umgk8przz": "We need 3 Databricks workspaces to build our data platform",
//       "1772310676690-7nyjo5foq": "Use terrafomr to deploy these 3 workspaces",
//       "1772310687667-3c24aocrb": "1772310970433-38txqtkwo",
//       "1772310706021-lhsg7gf8c": "10"
//     }
//   },
//   {
//     "id": "1772311235398-s5gm6g351",
//     "entityId": "1772310624109-pk7op268b",
//     "data": {
//       "1772310628695-557i0oaa3": "Metadata-driven Ingestion Framework",
//       "1772310649225-umgk8przz": "We don't want to duplicate code between all our ingestion pipelines, they're all the same. ",
//       "1772310676690-7nyjo5foq": "Create a reusable framework that allows us to create N instances of the same ingestion pipeline, just with different configs for different data sources. ",
//       "1772310687667-3c24aocrb": "1772310970433-38txqtkwo",
//       "1772310706021-lhsg7gf8c": "5"
//     }
//   },
//   {
//     "id": "1772311393803-1z3uglo7e",
//     "entityId": "1772310624109-pk7op268b",
//     "data": {
//       "1772310628695-557i0oaa3": "ETL project scaffolding tool",
//       "1772310649225-umgk8przz": "There are many resources involved in an ETL project, the github repo, service principals, access controls, datasets. These all need to be created for each project. ",
//       "1772310676690-7nyjo5foq": "Create a utility to provision an entire functional ETL pipeline project with just a few inputs",
//       "1772310687667-3c24aocrb": "1772310970433-38txqtkwo",
//       "1772310706021-lhsg7gf8c": "15"
//     }
//   },
//   {
//     "id": "1772311475049-dh2zyc8tp",
//     "entityId": "1772310624109-pk7op268b",
//     "data": {
//       "1772310628695-557i0oaa3": "Static Website hosting utility",
//       "1772310649225-umgk8przz": "Lots of people want to host static websites internally, and gate them to just Mirion employees. But they dont' want to all recreate the same infrastructure",
//       "1772310676690-7nyjo5foq": "Create a utility that lets users deploy static websites quickly and easily without worrying about any infrastructure. ",
//       "1772310687667-3c24aocrb": "1772310975099-v0fa6yy2x",
//       "1772310706021-lhsg7gf8c": "10"
//     }
//   },
//   {
//     "id": "1772311537450-yvm77drb5",
//     "entityId": "1772310624109-pk7op268b",
//     "data": {
//       "1772310628695-557i0oaa3": "M-Wiki",
//       "1772310649225-umgk8przz": "There's no single source of general Mirion knowledge within the company.",
//       "1772310676690-7nyjo5foq": "Deploy an instance of mediawiki to Azure, and make it available to Mirion employees",
//       "1772310687667-3c24aocrb": "1772310975099-v0fa6yy2x",
//       "1772310706021-lhsg7gf8c": "10"
//     }
//   },
//   {
//     "id": "1772311743691-ag7t1zuf2",
//     "entityId": "1772310728856-iqg7d9an4",
//     "data": {
//       "1772310736904-87mgwxh0e": "Terraform Project Scaffolding",
//       "1772310793220-tx3usihxv": "1772311032372-fezkg98fc",
//       "1772310812805-wbhza1et1": "",
//       "1772310819672-at1za4rik": "",
//       "1772311754844-qipv78am2": "1772311160508-sgmcxi2ut",
//       "1772311786126-3lnjygthw": "3"
//     }
//   },
//   {
//     "id": "1772311853261-x9q42jsgo",
//     "entityId": "1772310728856-iqg7d9an4",
//     "data": {
//       "1772310736904-87mgwxh0e": "Deploy Dev Workspace",
//       "1772310793220-tx3usihxv": "1772311016163-oclk0tyh3",
//       "1772311754844-qipv78am2": "1772311160508-sgmcxi2ut",
//       "1772311767609-rnawdo8x2": "",
//       "1772311786126-3lnjygthw": ""
//     }
//   },
//   {
//     "id": "1772311874283-rdnqs7o13",
//     "entityId": "1772310728856-iqg7d9an4",
//     "data": {
//       "1772310736904-87mgwxh0e": "Security Review for Dev Workspace",
//       "1772310793220-tx3usihxv": "1772311032372-fezkg98fc",
//       "1772311754844-qipv78am2": "1772311160508-sgmcxi2ut",
//       "1772311767609-rnawdo8x2": "",
//       "1772311786126-3lnjygthw": ""
//     }
//   },
//   {
//     "id": "1772311888953-9fcglpus1",
//     "entityId": "1772310728856-iqg7d9an4",
//     "data": {
//       "1772310736904-87mgwxh0e": "Deploy Prod Workspace",
//       "1772310793220-tx3usihxv": "1772311016163-oclk0tyh3",
//       "1772311754844-qipv78am2": "1772311160508-sgmcxi2ut",
//       "1772311767609-rnawdo8x2": "",
//       "1772311786126-3lnjygthw": ""
//     }
//   },
//   {
//     "id": "1772314337563-vqemjyh7z",
//     "entityId": "1772314277809-jjjk6l7dj",
//     "data": {
//       "1772314281608-ozqjm6iyk": "Deploy Dev",
//       "1772314287307-8wdl0g8k7": "1772311160508-sgmcxi2ut",
//       "1772314294858-tyhonzcgc": "1772311016163-oclk0tyh3,1772311002084-m82j2yvc2"
//     }
//   },
//   {
//     "id": "1772314350083-9v7kdmmxb",
//     "entityId": "1772314277809-jjjk6l7dj",
//     "data": {
//       "1772314281608-ozqjm6iyk": "Security Review",
//       "1772314287307-8wdl0g8k7": "1772311160508-sgmcxi2ut",
//       "1772314294858-tyhonzcgc": "1772311032372-fezkg98fc"
//     }
//   },
//   {
//     "id": "1772314359644-lhlzt9jek",
//     "entityId": "1772314277809-jjjk6l7dj",
//     "data": {
//       "1772314281608-ozqjm6iyk": "Deploy Prod",
//       "1772314287307-8wdl0g8k7": "1772311160508-sgmcxi2ut",
//       "1772314294858-tyhonzcgc": "1772311016163-oclk0tyh3,1772311002084-m82j2yvc2"
//     }
//   },
//   {
//     "id": "1772314431274-15wxb7fsf",
//     "entityId": "1772314402642-21mffrm6z",
//     "data": {
//       "1772314406157-j4k7c257l": "Deploy Dev",
//       "1772314412911-b4fb98xsq": "1772311160508-sgmcxi2ut",
//       "1772314420262-2afdzl91h": "1772311016163-oclk0tyh3,1772311002084-m82j2yvc2"
//     }
//   },
//   {
//     "id": "1772314440045-durewcq42",
//     "entityId": "1772314402642-21mffrm6z",
//     "data": {
//       "1772314406157-j4k7c257l": "Security Review",
//       "1772314412911-b4fb98xsq": "1772311160508-sgmcxi2ut",
//       "1772314420262-2afdzl91h": "1772311032372-fezkg98fc"
//     }
//   },
//   {
//     "id": "1772314446977-5cet4sjsv",
//     "entityId": "1772314402642-21mffrm6z",
//     "data": {
//       "1772314406157-j4k7c257l": "Deploy Prod",
//       "1772314412911-b4fb98xsq": "1772311160508-sgmcxi2ut",
//       "1772314420262-2afdzl91h": "1772311002084-m82j2yvc2,1772311016163-oclk0tyh3"
//     }
//   }
// ];
