import { FormGroup } from '@angular/forms';
import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { utils, WorkSheet, WorkBook, writeFile } from 'xlsx';
import { IgxGridCellComponent, IgxGridComponent } from 'igniteui-angular';
import { ToastrService } from 'ngx-toastr';
import uniqWith from 'lodash/uniqWith';
import findIndex from 'lodash/findIndex';
import { EmitterService } from './emitter.service';
import { SharedService } from 'src/app/modules/shared/shared.service';
import { CommonMessageService } from './common-message.service';

import { GlobalQueryModel } from 'src/app/models/global-query.model';

@Injectable()
export class GlobalService {

    public globalQuery: GlobalQueryModel;
    dynamicHeightCal;
    dataArray: any[] = [];
    headers: string[] = [];
    processFlag;
    keyCombinationArray = ['alt+q', 'alt+r', 'alt+u', 'alt+p', 'enter', 'alt+d', 'alt+c', 'alt+b'];
    selectionKey = 'NULL';

    constructor(private emitterService: EmitterService, private titleService: Title, public toastrservice: ToastrService,
        private messageService: CommonMessageService, private sharedService: SharedService,
        private router: Router) { }

    //#region  export to excel
    export(dataToExport: any[], xlFileName: string): void {
        const ws: WorkSheet = utils.aoa_to_sheet(dataToExport);
        const wb: WorkBook = utils.book_new();
        utils.book_append_sheet(wb, ws, 'Sheet1');
        writeFile(wb, xlFileName);
    }

    createDataArray(jsonObj): any {
        const dtArray: any[] = [];
        jsonObj = jsonObj;
        for (const key in jsonObj) {
            if (jsonObj.hasOwnProperty(key)) {
                dtArray.push(this.createInnerArray(jsonObj[key]));
            }
        }
        return dtArray;
    }

    createInnerArray(innerObj): any[] {
        const innerArray: any = [];
        for (const key in innerObj) {
            if (innerObj.hasOwnProperty(key)) {
                innerArray.push(innerObj[key]);
            }
        }
        return innerArray;
    }

    createHeader(jsonObj: any[]): any[] {
        const arryHeader: any[] = [];
        for (const key in jsonObj) {
            if (jsonObj.hasOwnProperty(key)) {
                arryHeader.push(key);
            }
        }
        return arryHeader;
    }

    exportToExcel(exportData: any[], fileName: string, headers?: string[], removeMessageFlag?) {
        this.dataArray = this.createDataArray(exportData);
        this.dataArray.unshift(headers);
        if (removeMessageFlag !== true) {
            this.dataArray.unshift(['']);
            this.dataArray.unshift(['than The Capital Group Companies, Inc. and its affiliates.']);
            this.dataArray.unshift(
                ['FOR INTERNAL USE ONLY. This information may not be published, retransmitted or redistributed to parties other']);
        }
        this.export(this.dataArray, fileName);
    }
    //#endregion
    //#region  Handle row selection
    handleRowSelection(targetCell, key, flagRowSelection, flagRowIndex, oldIndexValue, gridData): any {
        let arr = [];
        if (key === 'Control') {
            arr = this.ctrlPush(targetCell, flagRowSelection, flagRowIndex, oldIndexValue);
            flagRowSelection = arr[0];
            flagRowIndex = arr[1];
            oldIndexValue = arr[2];
        } else if (key === 'Shift') {
            arr = this.shiftPush(targetCell, flagRowSelection, flagRowIndex, oldIndexValue, gridData);
            flagRowSelection = arr[0];
            flagRowIndex = arr[1];
            oldIndexValue = arr[2];
        } else {
            flagRowSelection = [];
            flagRowIndex = [];
            flagRowSelection.push(targetCell.cellID.rowID);
            flagRowIndex.push(targetCell);
            oldIndexValue = targetCell.cellID.rowIndex;
        }

        return [flagRowSelection, flagRowIndex, oldIndexValue];
    }

    ctrlPush(targetCell, flagRowSelection: any[], flagRowIndex, oldIndexValue): any {
        if (flagRowSelection.includes(targetCell.rowData) && flagRowSelection.length > 1) {
            const arr = this.removeFromArray(targetCell, flagRowSelection, flagRowIndex);
            flagRowSelection = arr[0];
            flagRowIndex = arr[1];
            oldIndexValue = targetCell.cellID.rowIndex;
        } else {
            const simObjInd = this.findSimilarObject(flagRowSelection, targetCell.rowData);
            if (simObjInd >= 0) {
                flagRowSelection.splice(simObjInd, 1, targetCell.rowData);
            } else {
                flagRowSelection.push(targetCell.rowData);
            }
            flagRowIndex = JSON.parse(JSON.stringify(flagRowSelection));
            oldIndexValue = targetCell.cellID.rowIndex;
        }
        return [flagRowSelection, flagRowIndex, oldIndexValue];
    }

    private findSimilarObject(flagRowSelection: any[], rowData: any): number {
        return findIndex(flagRowSelection, (element) => {
            for (const key in rowData) {
                if (element[key] !== rowData[key]) {
                    return false;
                }
            }
            return true;
        });
    }

    shiftPush(targetCell, flagRowSelection, flagRowIndex, oldIndexValue, gridData): any {
        const new_index = targetCell.cellID.rowIndex;
        let arr = [];
        if (oldIndexValue < new_index) {
            arr = this.pushInRange(oldIndexValue, new_index, flagRowSelection, flagRowIndex, gridData);
        } else {
            arr = this.pushInRange(new_index, oldIndexValue, flagRowSelection, flagRowIndex, gridData);
        }
        flagRowSelection = arr[0];
        flagRowIndex = arr[1];
        return [flagRowSelection, flagRowIndex, oldIndexValue];
    }

    pushInRange(fromIndex, tillIndex, flagRowSelection, flagRowIndex, gridData): any {
        flagRowSelection = JSON.parse(JSON.stringify([]));
        flagRowIndex = JSON.parse(JSON.stringify([]));
        for (let currentIndex = fromIndex; currentIndex <= tillIndex; currentIndex++) {
            flagRowIndex.push(gridData[currentIndex]);
        }
        flagRowSelection = flagRowIndex;
        return [flagRowSelection, flagRowIndex];
    }

    removeFromArray(cell, flagRowSelection: any[], flagRowIndex): any {
        const obj = cell.rowData;
        const index = flagRowSelection.indexOf(obj);
        if (index >= 0) {
            flagRowSelection.splice(index, 1);
        }
        const indexFRI = flagRowIndex.indexOf(obj);
        if (indexFRI >= 0) {
            flagRowIndex.splice(indexFRI, 1);
        }
        return [flagRowSelection, flagRowIndex];
    }
    //#endregion

    showExport(flag: boolean) { this.emitterService.exportButtonShow.emit(flag); }

    showComment(flag: boolean) { this.emitterService.commentButtonShow.emit(flag); }

    showDelete(flag: boolean) { this.emitterService.deleteButtonShow.emit(flag); }

    showQuery(flag: boolean) { this.emitterService.queryButtonShow.emit(flag); }

    showReset(flag: boolean) { this.emitterService.resetButtonShow.emit(flag); }

    showProcess(flag: boolean) { this.emitterService.processButtonShow.emit(flag); }

    showSetup(flag: boolean) { this.emitterService.setupButtonEnable.emit(flag); }

    showImport(flag: boolean) { this.emitterService.importButtonShow.next(flag); }

    showImportOrder(flag: boolean) { this.emitterService.importOrderButtonShow.next(flag); }

    showAuditInfo(flag: boolean) { this.emitterService.auditInfoButtonShow.next(flag); }

    disableProcess(flag: boolean) {
        this.emitterService.processButtonDisableFlag.emit(flag);
        this.emitterService.processButtonState.next(flag);
    }

    disableQuery(flag: boolean) {
        this.emitterService.queryButtonDisableFlag.emit(flag);
        this.emitterService.queryButtonState.next(flag);
    }

    disableSetup(flag: boolean) {
        this.emitterService.disableSetupButton.emit(flag);
        this.emitterService.setupButtonState.next(flag);
    }

    disableDelete(flag: boolean) {
        this.emitterService.deleteButtonEnable.emit(flag);
        this.emitterService.deleteButtonState.next(flag);
    }
    disableAuditInfo(flag: boolean) {
        this.emitterService.auditButtonEnable.emit(flag);
    }

    disableRest(flag: boolean) {
        this.emitterService.resetButtonDisableFlag.emit(flag);
        this.emitterService.resetButtonState.next(flag);
    }

    disableComment(flag: boolean) {
        this.emitterService.commentButtonEventEmit.emit(flag);
        this.emitterService.commentButtonState.next(flag);
    }

    disableExport(flag: boolean) { this.emitterService.exportButtonDisableFlag.emit(flag); }

    showDetailExport(flag: boolean) { this.emitterService.exportDetailExlShow.emit(flag); }

    showCurrentExport(flag: boolean) { this.emitterService.exportCurrentExlShow.emit(flag); }

    showHistExport(flag: boolean) { this.emitterService.exportHistExlShow.emit(flag); }

    disableDetailExport(flag: boolean) { this.emitterService.exportDetailExlDisabled.emit(flag); }

    disableCurrentExport(flag: boolean) { this.emitterService.exportCurrentExlDisabled.emit(flag); }

    disableHistExport(flag: boolean) { this.emitterService.exportHistExlDisabled.emit(flag); }

    isDateValidate(inputDate: string) {
        const isValidDate = isNaN(Date.parse(inputDate));
        if (isValidDate) {
            return false;
        } else {
            return true;
        }
    }

    PerformOperationOnKeypress(combo: string) { this.emitterService.keysPressEvent.emit(combo); }

    createQueryString(inputParam: any): String {
        let retParam = '';
        let tempCount = 0;
        let key;
        for (key in inputParam) {
            if (inputParam.hasOwnProperty(key)) {
                if (inputParam[key] !== '' && inputParam[key] !== null && inputParam[key] !== undefined) {
                    tempCount++;
                    if (tempCount > 1) {
                        retParam += '&' + key + '=' + inputParam[key];
                    } else {
                        retParam += key + '=' + inputParam[key];
                    }
                }
            }
        }
        return retParam;
    }

    dynamicHeight(adjValuFloat, adjValuInt) {
        this.dynamicHeightCal = (((window.innerHeight - 40) * adjValuFloat - adjValuInt) + 'px');
        return this.dynamicHeightCal;
    }

    setScreenTitleOnClick(screenName: String) {
        this.titleService.setTitle(this.messageService.APP_NAME + ' - ' + screenName);
    }

    nevigateOnGrid(args: IgxGridCellComponent, dataSource: any[], RowId: any, grid: IgxGridComponent) {
        RowId = args.cellID.rowIndex;
        grid.selectRows([dataSource[RowId]], true);
        return RowId;
    }

    openNewTab(routerLink: string, title: string, saveQueryData?: boolean) {
        if (saveQueryData) {
            this.sharedService.setInLocalStorage('queryData', JSON.stringify(this.globalQuery));
        }
        this.sharedService.setInLocalStorage('routerLink', routerLink);
        this.sharedService.setInLocalStorage('screenTitle', title);
        window.open(this.router.url);
    }

    getAppRestrictValue(event): string {
        if (event.keyCode === 8 || event.keyCode === 46) {
            return null;
        } else {
            return 'date';
        }
    }

    filterdCountryCurrencyCheck(type: string, formFilter: FormGroup, list: any[], property: string, msg: string): FormGroup {
        let value = formFilter.controls[type].value;
        if (value) {
            value = value.toUpperCase();
            let exists = false;
            if (value !== '') {
                list.forEach(item => {
                    if (item[property].toLowerCase() === value.toLowerCase()) {
                        exists = true;
                    }
                });
                formFilter.controls[type].setValue(value);
                if (!exists) {
                    if (property === 'isoCrncyCd') {
                        if (value.length === 3) {
                            this.toastrservice.info(msg);
                        }
                    } else {
                        if (value.length === 2) {
                            this.toastrservice.info(msg);
                        }
                    }
                    formFilter.controls[type].setValue('');
                }
            }
        }
        return formFilter;
    }
    queryError(error: any, msg: string): string {
        if (
            error !== undefined &&
            error !== null &&
            error.message !== null &&
            error.message !== undefined
        ) {
            return error.message;
        } else {
            return msg;
        }
    }

    public autocompleteFilterCheck(type: string, formFilter: FormGroup, list: any[],
        property: string, msg: string, setToUppercase?: boolean): FormGroup {
        if (formFilter.controls[type] !== null && formFilter.controls[type] !== undefined) {
            let value = formFilter.controls[type].value;
            if (value !== null && value !== undefined) {
                value = value.toString().toUpperCase();
                let exists = false;
                if (value !== '') {
                    list.forEach(item => {
                        if (property === '') {
                            if (item.toString().toLowerCase() === value.toLowerCase()) {
                                exists = true;
                            }
                        } else {
                            if (item[property].toString().toLowerCase() === value.toLowerCase()) {
                                exists = true;
                            }
                        }
                    });
                    if (setToUppercase !== false) {
                        formFilter.controls[type].setValue(value);
                    }
                    if (!exists && value.length > 0) {
                        formFilter.controls[type].setValue('');
                    }
                }
            }
        }
        return formFilter;
    }

    returnUppLow(temp, value) {

        let isToLower = false;
        switch (temp) {
            case 'TELEKURS':
            case 'REUTERS':
            case 'S&P':
                isToLower = true;
                break;
        }

        if (isToLower) {
            return value;
        } else {
            return value.toUpperCase();
        }
    }
    getCleaveOptions(integerNum, decimalNum, negativeNum?) {
        const cleaveOptions = {
            numeral: true,
            numeralIntegerScale: integerNum,
            numeralDecimalScale: decimalNum,
            numeralPositiveOnly: negativeNum ? false : true
        };
        return cleaveOptions;
    }
    getNumber(value) {
        if (value) {
            return value.toString().replace(/,/g, '');
        }
        return value;
    }

}
