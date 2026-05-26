import React from 'react';
import './CampaingnsDetails.css';
import c_Img1  from'../campaingns/campaingnsImage/img-1.jpg';
import c_Img2  from'../campaingns/campaingnsImage/img-2.jpg';
import c_Img3  from'../campaingns/campaingnsImage/img-3.jpg';
import c_Img4  from'../campaingns/campaingnsImage/img-4.jpg';
import c_Img5  from'../campaingns/campaingnsImage/img-5.jpg';
import c_Img6  from'../campaingns/campaingnsImage/img-6.jpg';
import { Link } from 'react-router-dom';
import Footer from '../Footer';

const CampaingnsDetails = () => {
  return (
    <>
    <div className='campaingns_details'>
        <div className='campaingns_container'>
            <h3>Campaingns Details</h3>
            <p>
              Campaigns in the context of sports can refer to a variety of organized efforts aimed at promoting a cause, event, team, or athlete.
              These campaigns are designed to engage audiences, build support, and drive participation or viewership.
            </p>
            <div className='campaingns_main'>
                <span>Date: 26 April 2025</span>
                <div className='campaingns_img'>
                    <img src={c_Img1} alt=''/>
                </div>

                <div className='campaingns_img'>
                    <img src={c_Img2} alt=''/>
                </div>

                <div className='campaingns_img'>
                    <img src={c_Img3} alt=''/>
                </div>

                <div className='campaingns_img'>
                    <img src={c_Img4} alt=''/>
                </div>

                <div className='campaingns_img'>
                    <img src={c_Img5} alt=''/>
                </div>

                <div className='campaingns_img'>
                    <img src={c_Img6} alt=''/>
                </div>
            </div>
            <Link to='/news'>Back</Link>
        </div>
    </div>
    <Footer/>
    </>
  )
}

export default CampaingnsDetails