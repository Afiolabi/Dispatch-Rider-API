import React, { FormEventHandler } from 'react';
import Description, { DescriptionErrorState } from 
'../../components/ListingViews/Description';
import Details, { DetailsErrorState } from 
'../../components/ListingViews/Details';
import Media from '../../components/ListingViews/Media';
import Location, { LocationErrorState } from 
'../../components/ListingViews/Location';
import TabNavAction from '../../components/TabNavAction';
import TabNavigation from '../../components/TabNavigation';
import styles from './addlv.module.scss';
import Amenities from '../../components/ListingViews/Amenities';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../state/store';
import { Property, PropertyRequest } from '../../types/Property';
import { updateProperty } from '../../state/thunks/property';
import { useSWRConfig } from 'swr';
import CustomToast from '../../components/CustomToast';
import { addProperty, addPropertyImage } from '../../swr/properties';
import LoadingScreen from '../../components/LoadingScreen';
import { isEmpty } from '../../utils/formUtils';
import ToastContext from '../../contexts/ToastContext';
import { loadImages } from '../../state/reducers/propertySlice';

export interface AddListingsViewProps{
    isUpdate?: boolean;
    property?: Property;
}

const AddListingsView: React.FC<AddListingsViewProps> = ({ isUpdate, 
property })=>{

    // Contexts
    const { openError, openSuccess } = React.useContext(ToastContext);
    
    // Redux
    const dispatch = useDispatch<AppDispatch>();
    const { amenities, response, updateResponse } = useSelector((state: 
RootState)=> state.property);

    // Refs
    const formRef = React.createRef<HTMLFormElement>();
    const sectionRef = React.useRef<HTMLDivElement>(null)
    
    // Scroll
    const executeScroll = () => sectionRef.current?.scrollIntoView()    

    // Hooks
    const { mutate } = useSWRConfig();

    // Handlers
    const triggerChange = (eventValue: any)=>{
        const customEvent = new CustomEvent('updateProduct', { detail: { 
value: eventValue } });
        document.dispatchEvent(customEvent);
    }

    // UseEffect for update mode
    React.useEffect(()=>{
        triggerChange(property);
    }, [isUpdate])
    
    // Types
    type Views = {
        [index: string]: any;
    }

    // Initial Tabbed Views
    let initialViews: Views = {
        description: true,
        media: false,
        location: false,
        details: false,
        amenities: false
    }
    let initialUpdateViews: Views = {
        description: true,
        location: false,
        details: false,
        amenities: false
    }

    // States
    const [views, setView] = React.useState<{[index: string]: 
any}>(isUpdate ? initialUpdateViews : initialViews);
    const [viewKey, setViewKey] = React.useState<string>('description');
    const [activeIndex, setActiveIndex] = React.useState(0);
    const [errOpen, setErrOpen] = React.useState<boolean>(false);
    const [successOpen, setSuccessOpen] = React.useState<boolean>(false);
    const [loading, setLoading] = React.useState<boolean>(false);
    const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
    const [ownershipProof, setOwnershipProof] = React.useState<File>();

    // Error states for each view
    let initDescriptionErrorState: DescriptionErrorState = {
        title: false, description: false,
        price: false, duration: false
    }
    let initLocationErrorState: LocationErrorState = {
        address: false, country: false,
        state: false, city: false
    }
    let initDetailsErrorState: DetailsErrorState = {
        size: false, bedrooms: false, bathrooms: false,
        type: false, status: false
    }
    const [descriptionErrorState, setDescriptionErrorState] = 
React.useState<DescriptionErrorState>(initDescriptionErrorState);
    const [locationErrorState, setLocationErrorState] = 
React.useState<LocationErrorState>(initLocationErrorState);
    const [detailsErrorState, setDetailsErrorState] = 
React.useState<DetailsErrorState>(initDetailsErrorState);


    // Function to change view on tab change
    const changeView = (key: string)=>{
        setView({
            ...views,
            [viewKey]: false,
            [key.toLowerCase()]: true
        });
        setViewKey(key.toLowerCase());
    }

    // Steppers
    const stepper = (key: string)=>{
        changeView(key);
        setActiveIndex(Object.keys(views).indexOf(key));
        executeScroll();
    }

    //Unhighlight
    const unhighlightDescription = (event: React.ChangeEvent<any>)=>{
        setDescriptionErrorState((prevState)=>({...prevState, [event.target.name]: false}));
    }
    const unhighlightLocation = (event: React.ChangeEvent<any>)=>{
        setLocationErrorState((prevState)=>({...prevState, [event.target.name]: false}));
    }
    const unhighlightDetails = (event: React.ChangeEvent<any>)=>{
        setDetailsErrorState((prevState)=>({...prevState, [event.target.name]: false}));
    }

    // Handlers
    const handleMediaChange = (files: File[]) =>{
        setSelectedFiles(files);
    }
    const handleProofChange = (file?: File)=>{
        setOwnershipProof(file);
    }

    // Form validator
    const validateForm = (fdata: FormData): 'passed' | 'failed'=>{
        let result: 'passed' | 'failed' = 'passed';

        // Check if media and or proof of ownership has been added
        if (selectedFiles.length === 0 || !ownershipProof){
            result = 'failed';
        }

        // Check if any field is empty
        for (const pairs of fdata.entries()) {
            //console.log(pairs);
            if (isEmpty(pairs[1].toString())) {
                if (Object.prototype.hasOwnProperty.call(descriptionErrorState, pairs[0])){
                    setDescriptionErrorState((prevState)=>({...prevState, [pairs[0]]: true}));
                    result = 'failed';
                }
                if (Object.prototype.hasOwnProperty.call(locationErrorState, pairs[0])){
                    setLocationErrorState((prevState)=>({...prevState, [pairs[0]]: true}));
                    result = 'failed';
                }  
                if (Object.prototype.hasOwnProperty.call(detailsErrorState, pairs[0])){
                    setDetailsErrorState((prevState)=>({...prevState, [pairs[0]]: true}));
                    result = 'failed';
                }  
            }
        }
        return result;
    }


    // On Submit for form submission
    const onSubmit = async (event: React.FormEvent)=>{
        event.preventDefault();
        if (formRef.current) {
            const fdata = new FormData(formRef.current);

            if (validateForm(fdata) === 'passed'){
                // Handling numbers and special types
                let price = fdata.get('price');
                let usedPrice = price ? price.toString().replace(',', '') : '0';
                let size = fdata.get('size');
                let usedSize = size ? size.toString() : '0';
                let longitude = fdata.get('longitude');
                let usedLongitude = longitude ? longitude.toString() : '0';
                let latitude = fdata.get('latitude');
                let usedLatitude = latitude ? latitude.toString() : '0';

                console.log('isFeatured is:');
                console.log(fdata.get('isFeatured')?.toString())
            

                // The Request
                let preRequest: PropertyRequest | any = {
                    title: fdata.get('title')?.toString(),
                    description: fdata.get('description')?.toString(),
                    price: Number.parseFloat(usedPrice),
                    status: fdata.get('status')?.toString().replace(/\s/g, ''),
                    type: fdata.get('type')?.toString(),
                    size: Number.parseFloat(usedSize),
                    address: fdata.get('address')?.toString(),
                    state: fdata.get('state')?.toString(),
                    city: fdata.get('city')?.toString(),
                    //neighbourhood: fdata.get('neighbourhood')?.toString(),
                    longitude: Number.parseFloat(usedLongitude),
                    latitude: Number.parseFloat(usedLatitude),
                    zip: fdata.get('zip')?.toString(),
                    bedrooms: fdata.get('bedrooms')?.toString(),
                    bathrooms: fdata.get('bathrooms')?.toString(),
                    availability: fdata.get('availability')?.toString() === 'yes',
                    amenities: amenities,
                    attachments: [],
                    isFeatured: fdata.get('isFeatured')?.toString() === 'yes',
                    duration: fdata.get('duration')?.toString(),
                    parkingLot: 'No',
                    dateAdded: isUpdate && property ? property.dateAdded : new Date().toISOString(),
                }
                let token = localStorage.getItem('token') || undefined;
                console.log(preRequest);
                console.log(response + '##')

                const request = new FormData();
                for ( var key in preRequest ) {
                    request.append(key, preRequest[key]);
                }

                if (isUpdate && property?.id) {
                    dispatch(updateProperty({ 
                        request: { ...preRequest, isEnabled: property.isEnabled }, 
                        token, 
                        id: property.id 
                    }));
                } else{
                    setLoading(true);
                    const { data, error } = await addProperty({ request: preRequest, token })
                    if (data) {

                        // Check If there are images
                        if (selectedFiles.length > 0) {
                            const uploadResult = await addPropertyImage({ 
                                id: data.id || 0,
                                files: selectedFiles,
                                token: token
                            })

                            if (uploadResult.data) {
                                // Trigger revalidation
                                mutate(`/api/properties?PageNumber=1&PageSize=1000000`);
                                setLoading(false);
                                setSuccessOpen(true);
                            }

                            if (uploadResult.error){
                                mutate(`/api/properties?PageNumber=1&PageSize=1000000`);
                                setLoading(false);
                                openSuccess('Property submitted, awaiting admin approval');
                                openError('Could not upload images');
                            }

                        }
                        else{
                            // Trigger revalidation
                            mutate(`/api/properties?PageNumber=1&PageSize=1000000`);
                            setLoading(false);
                            setSuccessOpen(true);
                        }
                    }
                    if (error) {
                        setLoading(false);
                        setErrOpen(true);
                    }
                 dispatch(updateProperty({
                     request: preRequest, token,
                     id: ''
                 }));
                }
            }
            else{
                openError('Please fill in all required fields');
            }
           
        }
    }

    return(
        <>
         {loading && <LoadingScreen/>}
        <CustomToast errOpen={errOpen} successOpen={successOpen}
            onErrClose={()=> setErrOpen(false)} onSuccessClose={()=> setSuccessOpen(false)}
            errMessage={'An error occurred while adding your property'}
            successMessage={'Property submitted, awaiting admin approval'}
        />
        <div className="ltn__appointment-area pt-115--- pb-120" ref={sectionRef}>
            <div className={`container`}>
                <div className="row">
                    <div className="col-lg-12">
                        <form noValidate onSubmit={(e)=> e.preventDefault()} ref={formRef}>

                            {/** Tabbed Nav */}
                            <div className="ltn__tab-menu ltn__tab-menu-3 ltn__tab-menu-top-right-- text-uppercase--- text-center">
                                {
                                    !isUpdate &&
                                    <TabNavigation onChange={changeView} index={activeIndex}>
                                        <TabNavAction label="Description"/>
                                        <TabNavAction label="Media"/>
                                        <TabNavAction label="Location"/>
                                        <TabNavAction label="Details"/>
                                        <TabNavAction label="Amenities"/>
                                    </TabNavigation>
                                }
                                {
                                    isUpdate &&
                                    <TabNavigation onChange={changeView} 
                                    index={activeIndex}>
                                        <TabNavAction label="Description"/>
                                        <TabNavAction label="Location"/>
                                        <TabNavAction label="Details"/>
                                        <TabNavAction label="Amenities"/>
                                    </TabNavigation>
                                }
                            </div>

                            {/** View */}
                            <div className="tab-content">
                                <div style={{ display: views.description ? 
'block' : 'none'}}>
                                    <Description onNextStep={stepper} 
nextKey={isUpdate ? 'location' : 'media'}
                                        errorState={descriptionErrorState}
                                        
unhighlight={unhighlightDescription} 
                                    />
                                </div>
                                <div style={{ display: views.media ? 
'block' : 'none'}}>
                                    <Media 
                                        onNextStep={stepper} 
nextKey='location'
                                        onPrevStep={stepper} 
prevKey='description'
                                        onMediaChange={handleMediaChange}
                                        onProofChange={handleProofChange}
                                    />
                                </div>
                                <div style={{ display: views.location ? 
'block' : 'none'}}>
                                    <Location
                                        onNextStep={stepper} 
nextKey='details'
                                        onPrevStep={stepper} 
prevKey={isUpdate ? 'description' : 'media'}
                                        errorState={locationErrorState}
                                        unhighlight={unhighlightLocation}
                                    />
                                </div>
                                <div style={{ display: views.details ? 
'block' : 'none'}}>
                                    <Details
                                        onNextStep={stepper} 
nextKey='amenities'
                                        onPrevStep={stepper} 
prevKey='location'
                                        errorState={detailsErrorState}
                                        unhighlight={unhighlightDetails}
                                    />
                                </div>
                                <div style={{ display: views.amenities ? 
'block' : 'none'}}>
                                    <Amenities onSubmit={onSubmit} 
onPrevStep={stepper} prevKey='details'
                                    />
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

        </div>
        </>
    )
}

export default AddListingsView;
