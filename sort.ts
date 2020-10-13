import { findIndex } from 'lodash/findIndex';
import { Injectable } from '@angular/core';
import { SortingDirection } from 'igniteui-angular';
import * as lodash from 'lodash';

@Injectable()
export class SortService {

  constructor() { }

  generalSortAlphaNumAsc(temp: any[], type: string) {
    const regex1 = new RegExp(/[^a-zA-Z]/g);
    const regex2 = new RegExp(/[^0-9]/g);
    temp.sort((t1, t2) => {
      const t1A = t1[type].replace(regex1, '');
      const t2A = t2[type].replace(regex1, '');
      if (t1A === t2A) {
        const t1N = parseInt(t1[type].replace(regex2, ''), 10);
        const t2N = parseInt(t2[type].replace(regex2, ''), 10);
        return t1N === t2N ? 0 : t1N > t2N ? 1 : -1;
      } else {
        return t1A > t2A ? 1 : -1;
      }
    });
    return temp;

  }

  generalSortAlphaNumDesc(temp: any[], type: string) {
    const regex1 = new RegExp(/[^a-zA-Z]/g);
    const regex2 = new RegExp(/[^0-9]/g);
    temp.sort((t1, t2) => {
      const t1A = t1[type].replace(regex1, '');
      const t2A = t2[type].replace(regex1, '');
      if (t1A === t2A) {
        const t1N = parseInt(t1[type].replace(regex2, ''), 10);
        const t2N = parseInt(t2[type].replace(regex2, ''), 10);
        return t1N === t2N ? 0 : t1N > t2N ? -1 : 1;
      } else {
        return t1A > t2A ? -1 : 1;
      }
    });
    return temp;

  }

  generalSortAsc(temp: any[], type: string) {

    temp.sort((t1, t2) => {
      if (t1[type] > t2[type]) {
        return 1;
      }

      if (t1[type] < t2[type]) {
        return -1;
      }

      return 0;
    });
    return temp;
  }

  generalSortDesc(temp: any[], type: string) {

    temp.sort((t1, t2) => {
      if (t1[type] < t2[type]) {
        return 1;
      }

      if (t1[type] > t2[type]) {
        return -1;
      }

      return 0;
    });
    return temp;
  }

  generalSortDateLatest(temp: any[], type) {
    temp.sort((t1, t2) => {
      return Number(new Date(t2[type])) - Number(new Date(t1[type]));
    });
    return temp;
  }

  generalSortDateOldest(temp: any[], type) {
    temp.sort((t1, t2) => {
      return Number(new Date(t1[type])) - Number(new Date(t2[type]));
    });
    return temp;
  }

  applySort(value: string, sortOrderList: Map<string, number>, sortList) {
    let foundFlag = false;
    let ind = 0;
    if (sortOrderList.has(value)) {
      const temp = sortOrderList.get(value);
      if (temp === SortingDirection.Asc) {
        sortOrderList.set(value, SortingDirection.Desc);
      } else if (temp === SortingDirection.Desc) {
        sortOrderList.set(value, SortingDirection.None);
      } else {
        sortOrderList.set(value, SortingDirection.Asc);
      }
    }

    for (const item of sortList) {
      if (item.fieldName === value) {
        foundFlag = true;
        if (item.dir === SortingDirection.Asc) {
          item.dir = SortingDirection.Desc;
        } else if (item.dir === SortingDirection.Desc) {
          sortList.splice(ind, 1);
        }
        break;
      }
      ind++;
    }

    if (!foundFlag) {
      sortList.push({ fieldName: value, dir: SortingDirection.Asc, ignoreCase: true });
    }
    return [sortOrderList, sortList];
  }

  applySortCustom(sortBy: string, sortList: any[], columnPropMap: any, sortListOrder: any[], gridData: any[]) {
    if (!sortList.includes(sortBy)) {
      if (columnPropMap.get(sortBy) === 'desc') {
        sortList.push(sortBy);
        sortListOrder.push('asc');
        columnPropMap.set(sortBy, 'asc');
      } else if (columnPropMap.get(sortBy) === 'asc') {
        sortList.push(sortBy);
        sortListOrder.push('desc');
        columnPropMap.set(sortBy, 'desc');
      } else {
        columnPropMap.set(sortBy, 'asc');
        sortList.splice(sortList.indexOf(sortBy), 1);
        sortListOrder.splice(sortList.indexOf(sortBy), 1);
      }
    } else {
      if (columnPropMap.get(sortBy) === 'desc') {
        columnPropMap.set(sortBy, 'asc');
        sortListOrder.splice(sortList.indexOf(sortBy), 1, 'asc');
      } else if (columnPropMap.get(sortBy) === 'asc') {
        columnPropMap.set(sortBy, 'desc');
        sortListOrder.splice(sortList.indexOf(sortBy), 1, 'desc');
      } else {
        columnPropMap.set(sortBy, 'asc');
        sortListOrder.splice(sortList.indexOf(sortBy), 1);
        sortList.splice(sortList.indexOf(sortBy), 1);
      }
    }
    if (gridData.length !== 0) {
      gridData = lodash.orderBy([...gridData],
        sortList.map(s => {
          const ind = lodash.findIndex(gridData, (element) => {
            return element[s] !== null && element[s] !== undefined && element[s] !== '';
          });
          return (r: any) => {
            return r[s] !== null ? r[s] :
              ((ind >= 0 && typeof gridData[ind][s] === 'number') ? Number.NEGATIVE_INFINITY : '');

          };
        }), sortListOrder);
    }
    return {
      'sortList': sortList,
      'columnPropMap': columnPropMap,
      'sortListOrder': sortListOrder,
      'gridData': gridData
    };
  }
}
