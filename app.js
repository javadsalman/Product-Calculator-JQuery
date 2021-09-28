// UI
const UIController = (function(){

    const nameInput = $('#name-input');
    const priceInput = $('#price-input');
    const saveButton = $('#save-button');
    const deleteButton = $('#delete-button');
    const cancelButton = $('#cancel-button');
    const addButton = $('#add-button');
    const tableBody = $('#table-body');
    const tlResult = $('#tl-result');
    const euroResult = $('#euro-result');

    function getNameandPrice(){
        const name = nameInput.val();
        const price = Number(priceInput.val());
        const completePrice = Number(price.toFixed(2))
        return {name: name, price: completePrice}
    }
    
    function changeNameandPrice(row){
        const name = row.find('.name-col').text();
        const price = row.find('.price-col').text().slice(0, -1)
        nameInput.val(name);
        priceInput.val(price);
    }

    function clearNameandPrice(){
        nameInput.val('');
        priceInput.val('');
    }

    function bigLetterStartEvent(){
        nameInput.keyup(function(){
            $(this).val(function(i, str){
                if (str)
                    return str[0].toUpperCase() + str.slice(1);
            });
        });
    }

    function appearanceChangeButtons(boolean){
        if (boolean == true){
            $('.changes').removeClass('d-none')
            $('#add-button').addClass('d-none')
        }else{
            $('.changes').addClass('d-none')
            $('#add-button').removeClass('d-none')
        }
    }


    function addRow(rowData){
        const newRow = $(
            `<tr id="row-${rowData.index}" class="table-row user-select-none">
                <th class="index-col user-select-none"></th>
                <td class="name-col">${rowData.name}</td>
                <td class="price-col">${rowData.price}$</td>
                <td id="button-row-${rowData.index}" class="text-end change-button-col">
                    <span class="change-button py-2 px-3 btn">
                        <i class="far fa-edit fa-lg text-light"></i>
                    </span>
                </td>
            </tr>`
        );
        tableBody.append(newRow);
    }

    function refreshIndexes(){
        $('.index-col').text(function(index){
            return index+1;
        });
    }

    function changeRow(row, namePriceObj){
        row.find('.name-col').text(namePriceObj.name);
        row.find('.price-col').text(namePriceObj.price+'$')
    }

    function getIndexFromRow(row){
        const id = row.attr('id');
        const regex = /row-(\d+)/
        const strIndex =  regex.exec(id)[1]
        return Number(strIndex);
    }

    function disSelectAll(exceptRow){
        const exceptID = exceptRow.attr('id')
        $('.table-active').removeClass(function(){
            if ($(this).attr('id') !== exceptID)
            return 'table-active'
        })
    }


    function rowActivate(row){
        row.addClass('table-active');
    }

    function rowDeactivate(row){
        row.removeClass('table-active')
    }

    function select(row){
        disSelectAll(row);
        rowActivate(row);
        appearanceChangeButtons(true);
        changeNameandPrice(row);
    }

    function cancel(row){
        rowDeactivate(row);
        appearanceChangeButtons(false);
        clearNameandPrice();
    }


    function changeTL(value){
        tlResult.text(`${value} TL`);
    }
    function changeeuro(value){
        euroResult.text(`${value}€`);
    }


    
    return {
        // properties
        nameInput,
        priceInput,
        addButton,
        saveButton,
        cancelButton,
        deleteButton,
        tableBody,
        // functions
        getNameandPrice,
        changeNameandPrice,
        clearNameandPrice,
        bigLetterStartEvent,
        appearanceChangeButtons,
        addRow,
        refreshIndexes,
        changeRow,
        getIndexFromRow,
        select,
        cancel,
        changeTL,
        changeeuro,
        disSelectAll,
    }

})();





const StorageController = (function(){
    function getData(){
        const data = localStorage.getItem('data')
        if (data)
            return JSON.parse(data);
        else
            return [];
    }

    function saveData(data){
        localStorage.setItem('data', JSON.stringify(data))
    }

    
    return {
        getData,
        saveData,
    }
    
})();






const ProductController = (function(){
    function getPriceResults(data, callback){
        const response = $.get({
            url: 'http://api.exchangeratesapi.io/v1/latest',
            data: {access_key: 'fa1c84ee758a9b1cacd94959386c0667'},
            async: true,
            success: function(response){
                const euroRate = response.rates.TRY;
                const total = caclulateTotal(data, euroRate)
                callback(total)
            }
        });
    }

    function caclulateTotal(data, euroRate){
        let total = 0;
        for(let i=0; i<data.length; i++){
            total += data[i].price; 
        }
        const totalTL = Number((total*euroRate).toFixed(2))
        return {
            euro: total,
            tl: totalTL
        }
    }
    

    function addRowData(data, newData){
        data.push(newData);
    }
    
    function changeRowData(data, index, namePriceObj){
        for(let i=0; i<data.length; i++){
            const rowData = data[i];
            if (rowData.index === index)
                Object.assign(rowData, namePriceObj);
        }
        
    }

    function deleteRowData(data, index){
        for(let arrayIndex=0; arrayIndex<data.length; arrayIndex++){
            const rowData = data[arrayIndex];
            if (rowData.index === index)
                data.splice(arrayIndex, 1);
        }
    }

    function getLastIndex(data){
        if (data.length)
            return data[data.length-1].index;
        else
            return -1;
    }

    

    return {
        getPriceResults,
        caclulateTotal,
        changeRowData,
        addRowData,
        deleteRowData,
        getLastIndex,
    }
})();




const AppContorller = (function(uicl, scl, pcl){
    function showTotal(data){
        uicl.changeTL('loading...');
        uicl.changeeuro('loading...');
        pcl.getPriceResults(data, function(total){
            uicl.changeTL(total.tl);
            uicl.changeeuro(total.euro);
        })
    }

    function showProducts(data){
        data.forEach(function(rowData){
            uicl.addRow(rowData);
        })
        uicl.refreshIndexes();
    }

    function commitChanges(data){
        uicl.refreshIndexes();
        showTotal(data);
        scl.saveData(data);

    }

    function startEvents(loadedData){
        uicl.bigLetterStartEvent();
        uicl.tableBody.on('click', '.change-button', selectEvent);
        uicl.addButton.click(addEvent.bind({data: loadedData}));
        uicl.saveButton.click(changeEvent.bind({data: loadedData}));
        uicl.deleteButton.click(deleteEvent.bind({data: loadedData}));
        uicl.cancelButton.click(cancelEvent);
        $('body').on('keyup', function(event){
            if (event.key === 'Escape')
                cancelEvent();
            else if (event.key === 'Delete')
                deleteEvent(loadedData);
        });
        enterKeyEvent(loadedData);
    }


    function selectEvent(){
        const row = $(this).parent().parent()
        if (row.hasClass('table-active')){
            uicl.cancel(row);
        }else{
            uicl.select(row);
        }
    }

    function addEvent(data=null){
        data = this.data || data
        const nameandPrice = uicl.getNameandPrice();
        const index = pcl.getLastIndex(data) + 1;
        const rowData = {index, ...nameandPrice};
        pcl.addRowData(data, rowData);
        uicl.addRow(rowData);
        uicl.clearNameandPrice();
        uicl.nameInput.focus();
        commitChanges(data);

    }

    function changeEvent(data=null){
        data = this.data || data
        const selectedRow = $('.table-active');
        const rowIndex = uicl.getIndexFromRow(selectedRow);
        const namePriceObj = uicl.getNameandPrice();
        uicl.changeRow(selectedRow, namePriceObj);
        pcl.changeRowData(data, rowIndex, namePriceObj);
        commitChanges(data);
    }

    function deleteEvent(data=null){
        data = this.data || data
        const row = $('.table-active');
        const rowIndex = uicl.getIndexFromRow(row)
        row.remove()
        pcl.deleteRowData(data, rowIndex);
        uicl.cancel(row);
        commitChanges(data);
    }

    function cancelEvent(){
        const row = $('.table-active');
        uicl.cancel(row);
    }

    function enterKeyEvent(data){
        uicl.nameInput.add(uicl.priceInput).keyup(function(event){
            if (event.key === 'Enter'){
                if (uicl.addButton.hasClass('d-none'))
                    changeEvent(data);
                else
                    addEvent(data);
            }
        })
        
    }
    


    function init(){
        const data = scl.getData();
        showProducts(data);
        showTotal(data);
        startEvents(data)
    }

    return {
        init,
    }

})(UIController, StorageController, ProductController)


AppContorller.init()

