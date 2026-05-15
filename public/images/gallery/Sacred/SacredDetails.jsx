import React from 'react'
import { Link } from 'react-router-dom'
import sacred_img1 from '../Sacred/SacredImages/Img-2.jpg';
import sacred_img2 from '../Sacred/SacredImages/Img-5.jpg';
import sacred_img3 from '../Sacred/SacredImages/Img-3.jpeg';
import sacred_img4 from '../Sacred/SacredImages/Img-4.jpeg';
import sacred_img5 from '../Sacred/SacredImages/Img-6.jpg';
import sacred_img6 from '../Sacred/SacredImages/Img-7.jpg';
import './SacredDetails.css';
import Footer from '../Footer';

const SacredDetails = () => {
  return (
    <>
    <div className='sacred_details'>
        <div className='sacred_container'>
            <h3>Blanket donation by MAA to Sacred Hearts Details</h3>
            <p>
                Winter can be especially hard for those without adequate shelter. MAA hosted a Blanket Drive last weekend to help keep everyone warm and safe. Thank you all the volunteers for the support.
            </p>
            <div className='sacred_main'>
                <span>Date: 13 December 2025</span>
                <div className='sacred_img'>
                    <img src={sacred_img1} alt=''/>
                </div>

                <div className='sacred_img'>
                    <img src={sacred_img2} alt=''/>
                </div>

                <div className='sacred_img'>
                    <img src={sacred_img3} alt=''/>
                </div>

                <div className='sacred_img'>
                    <img src={sacred_img4} alt=''/>
                </div>

                <div className='sacred_img'>
                    <img src={sacred_img5} alt=''/>
                </div>

                <div className='sacred_img'>
                    <img src={sacred_img6} alt=''/>
                </div>
            </div>
            <Link to='/news'>Back</Link>
        </div>
    </div>
    <Footer/>
    </>
  )
}

export default SacredDetails;